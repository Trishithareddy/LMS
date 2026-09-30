const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function getPdfObject(page, objectId) {
    return new Promise((resolve, reject) => {
        try {
            if (page.objs.has(objectId)) {
                const object = page.objs.get(objectId);
                resolve(object);
                return;
            }

            page.objs.get(objectId, (object) => {
                resolve(object);
            });
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Basic technical filter.
 *
 * IMPORTANT:
 * This does NOT decide whether an image is educationally useful.
 *
 * It only removes obvious technical problems such as:
 * - extremely small images
 * - extremely thin image fragments
 */
function classifyBasicImage(width, height) {

    if (!width || !height) {
        return {
            usable: false,
            reason: "missing-dimensions"
        };
    }

    const smallest = Math.min(width, height);
    const largest = Math.max(width, height);

    const aspectRatio = largest / smallest;

    // Very tiny images are usually icons/fragments/masks.
    const MIN_DIMENSION = 80;

    // Extremely thin images are usually PDF fragments.
    const MAX_ASPECT_RATIO = 8;

    if (smallest < MIN_DIMENSION) {
        return {
            usable: false,
            reason: "too-small"
        };
    }

    if (aspectRatio > MAX_ASPECT_RATIO) {
        return {
            usable: false,
            reason: "extreme-aspect-ratio"
        };
    }

    return {
        usable: true,
        reason: "passes-basic-filter"
    };
}


/**
 * Extract embedded raster images from a textbook PDF.
 *
 * Step 2:
 * Extract images that actually exist inside the PDF.
 *
 * Step 4:
 * Apply basic technical filtering and attach metadata.
 */
async function extractTextbookImages(pdfPath, outputDir) {

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF file not found: ${pdfPath}`);
    }

    await fs.promises.mkdir(outputDir, {
        recursive: true
    });

    // Example:
    // outputDir =
    // .../uploads/extracted-pages/1788242398836
    //
    // We use this folder name to construct browser URLs.
    const folderId = path.basename(outputDir);

    // PDF.js v6 is ESM.
    const pdfjsLib =
        await import("pdfjs-dist/legacy/build/pdf.mjs");

    const pdfData = new Uint8Array(
        await fs.promises.readFile(pdfPath)
    );

    const loadingTask = pdfjsLib.getDocument({
        data: pdfData
    });

    const pdfDocument = await loadingTask.promise;

    const extractedImages = [];

    try {

        for (
            let pageNumber = 1;
            pageNumber <= pdfDocument.numPages;
            pageNumber++
        ) {

            console.log(
                `Scanning PDF page ${pageNumber} for embedded images...`
            );

            const page =
                await pdfDocument.getPage(pageNumber);

            const operatorList =
                await page.getOperatorList();

            let imageNumber = 0;

            for (
                let i = 0;
                i < operatorList.fnArray.length;
                i++
            ) {

                const operator =
                    operatorList.fnArray[i];

                const args =
                    operatorList.argsArray[i];

                const isImageOperation =
                    operator === pdfjsLib.OPS.paintImageXObject ||
                    operator === pdfjsLib.OPS.paintJpegXObject;

                if (!isImageOperation) {
                    continue;
                }

                const objectId = args[0];

                console.log(
                    `Found image object on page ${pageNumber}: ${objectId}`
                );

                let imageObject;

                try {

                    imageObject =
                        await getPdfObject(
                            page,
                            objectId
                        );

                } catch (error) {

                    console.error(
                        `Could not get image object ${objectId}:`,
                        error.message
                    );

                    continue;
                }

                if (!imageObject) {

                    console.log(
                        `Image object ${objectId} is empty`
                    );

                    continue;
                }

                const width =
                    imageObject.width;

                const height =
                    imageObject.height;

                const data =
                    imageObject.data;

                if (
                    !width ||
                    !height ||
                    !data
                ) {

                    console.log(
                        `Image ${objectId} does not contain usable raw data`
                    );

                    continue;
                }

                /*
                 * PDF.js may provide RGB/RGBA data.
                 */

                let channels = 4;

                const expectedRGBA =
                    width *
                    height *
                    4;

                const expectedRGB =
                    width *
                    height *
                    3;

                if (data.length === expectedRGB) {

                    channels = 3;

                } else if (
                    data.length === expectedRGBA
                ) {

                    channels = 4;

                } else {

                    console.log(
                        `Unknown image data size for ${objectId}:`,
                        data.length,
                        `expected RGB=${expectedRGB}, RGBA=${expectedRGBA}`
                    );

                    continue;
                }

                imageNumber++;

                const filename =
                    `page-${pageNumber}-image-${imageNumber}.png`;

                const imagePath =
                    path.join(
                        outputDir,
                        filename
                    );

                try {

                    await sharp(
                        Buffer.from(data),
                        {
                            raw: {
                                width,
                                height,
                                channels
                            }
                        }
                    )
                        .png()
                        .toFile(imagePath);

                    /*
                     * -----------------------------------------
                     * BASIC IMAGE FILTER
                     * -----------------------------------------
                     */

                    const basicClassification =
                        classifyBasicImage(
                            width,
                            height
                        );

                    /*
                     * Browser URL
                     *
                     * Example:
                     *
                     * /extracted-images/
                     * 1788242398836/
                     * page-1-image-1.png
                     */

                    const url =
                        `/extracted-images/${encodeURIComponent(
                            folderId
                        )}/${encodeURIComponent(
                            filename
                        )}`;

                    const imageInfo = {

                        pageNumber,

                        imageNumber,

                        type: "embedded-image",

                        filename,

                        path: imagePath,

                        url,

                        width,

                        height,

                        aspectRatio:
                            Number(
                                (Math.max(width, height) /
                                    Math.min(width, height))
                                    .toFixed(2)
                            ),

                        usable:
                            basicClassification.usable,

                        reason:
                            basicClassification.reason
                    };

                    extractedImages.push(
                        imageInfo
                    );

                    console.log(
                        `Saved ${filename} ` +
                        `(${width}x${height}) ` +
                        `→ usable=${imageInfo.usable} ` +
                        `(${imageInfo.reason})`
                    );

                } catch (imageError) {

                    console.error(
                        `Failed to save ${filename}:`,
                        imageError.message
                    );

                }
            }

            page.cleanup();
        }

    } finally {

        // PDF.js v6:
        // destroy the loading task, not PDFDocumentProxy.
        await loadingTask.destroy();
    }

    /*
     * -----------------------------------------
     * SUMMARY
     * -----------------------------------------
     */

    const usableImages =
        extractedImages.filter(
            image => image.usable
        );

    const rejectedImages =
        extractedImages.filter(
            image => !image.usable
        );

    console.log(
        "========================================"
    );

    console.log(
        `Total extracted images: ${extractedImages.length}`
    );

    console.log(
        `Usable candidates: ${usableImages.length}`
    );

    console.log(
        `Rejected by basic filter: ${rejectedImages.length}`
    );

    console.log(
        "========================================"
    );

    return {
    images: extractedImages,

    totalPages:
        pdfDocument.numPages,

    totalImages:
        extractedImages.length,

    usableImages:
        usableImages.length,

    rejectedImages:
        rejectedImages.length,

    folderId
};
}


module.exports = {
    extractTextbookImages
};