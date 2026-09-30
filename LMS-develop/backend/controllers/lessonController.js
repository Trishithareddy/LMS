
const Lesson = require('../models/Lesson');
const Chapter = require('../models/Chapter');
const Course = require('../models/Course')
const mongoose = require('mongoose')
const cloudinary = require("../middleware/cloudinary");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const JSZip = require("jszip");

const VideoContent = require("../models/VideoContent");
const VideoProgress = require("../models/VideoProgressSchema");
const StudentSlideProgress = require('../models/studentSlideProgressSchema');
const StudentChapterProgress = require('../models/studentChapterProgress');

const StudentCourseProgress = require('../models/studentCourseProgress');
const BatchChapterAccess = require('../models/BatchChapterAccess');

const execFileAsync = promisify(execFile);

const getOfficeCommandCandidates = () => {
    const configured = process.env.LIBREOFFICE_PATH || process.env.SOFFICE_PATH;
    return [
        configured,
        "soffice",
        "libreoffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ].filter(Boolean);
};

const runLibreOfficeConvert = async (inputPath, outputDir) => {
    const args = [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        outputDir,
        inputPath,
    ];

    let lastError = null;
    for (const command of getOfficeCommandCandidates()) {
        try {
            await execFileAsync(command, args, { timeout: 120000 });
            return;
        } catch (error) {
            lastError = error;
        }
    }

    throw new Error(
        `LibreOffice/soffice is required to import PPT files. ${lastError?.message || ""}`.trim(),
    );
};

const convertPptToPdf = async (pptPath) => {
    const outputDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "lesson-ppt-"),
    );

    await runLibreOfficeConvert(pptPath, outputDir);

    const baseName = path.basename(pptPath, path.extname(pptPath));
    const expectedPdf = path.join(outputDir, `${baseName}.pdf`);

    try {
        await fs.promises.access(expectedPdf);
        return { pdfPath: expectedPdf, outputDir };
    } catch {
        const files = await fs.promises.readdir(outputDir);
        const pdfFile = files.find((file) => file.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            throw new Error("PPT conversion finished but no PDF was generated.");
        }
        return { pdfPath: path.join(outputDir, pdfFile), outputDir };
    }
};

const getCloudinaryPageUrl = (publicId, pageNumber) =>
    cloudinary.url(`${publicId}.jpg`, {
        resource_type: "image",
        secure: true,
        transformation: [
            {
                page: pageNumber,
                fetch_format: "jpg",
                quality: "auto",
            },
        ],
    });

const decodeXmlEntities = (value = "") =>
    value
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

const extractTextFromXml = (xml = "") =>
    [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
        .map((match) => decodeXmlEntities(match[1]).trim())
        .filter(Boolean)
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const resolvePptTarget = (fromFile, target) => {
    if (!target) return null;
    if (target.startsWith("/")) return target.replace(/^\/+/, "");
    const fromDir = path.posix.dirname(fromFile);
    return path.posix.normalize(path.posix.join(fromDir, target));
};

const extractPptSpeakerNotes = async (pptPath) => {
    try {
        const pptBuffer = await fs.promises.readFile(pptPath);
        const zip = await JSZip.loadAsync(pptBuffer);
        const slideFiles = Object.keys(zip.files)
            .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
            .sort((a, b) => {
                const aNum = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
                const bNum = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
                return aNum - bNum;
            });

        const notesBySlide = [];

        for (const slideFile of slideFiles) {
            const relsPath = slideFile.replace(
                /ppt\/slides\/(slide\d+\.xml)$/i,
                "ppt/slides/_rels/$1.rels",
            );
            const relsEntry = zip.file(relsPath);
            if (!relsEntry) {
                notesBySlide.push("");
                continue;
            }

            const relsXml = await relsEntry.async("string");
            const notesRelMatch = relsXml.match(
                /<Relationship\b(?=[^>]*Type="[^"]*\/notesSlide")(?=[^>]*Target="([^"]+)")[^>]*>/i,
            );
            const notesTarget = notesRelMatch?.[1];
            const notesPath = resolvePptTarget(slideFile, notesTarget);
            const notesEntry = notesPath ? zip.file(notesPath) : null;

            if (!notesEntry) {
                notesBySlide.push("");
                continue;
            }

            const notesXml = await notesEntry.async("string");
            const text = extractTextFromXml(notesXml)
                .split("\n")
                .map((line) => line.trim())
                .filter(
                    (line) =>
                        line &&
                        !/^click to add notes$/i.test(line) &&
                        line !== "‹#›",
                )
                .join("\n")
                .trim();

            notesBySlide.push(text);
        }

        return notesBySlide;
    } catch (error) {
        console.warn("Could not extract PPT speaker notes:", error.message);
        return [];
    }
};

const buildPptImageSlide = (imageUrl, pageNumber, sourceName, expectedTime, speakerNotes) => ({
    content: `
        <div style="width:100%;display:flex;justify-content:center;align-items:center;background:#ffffff;">
            <img src="${imageUrl}" alt="${sourceName} slide ${pageNumber}" style="width:100%;height:auto;display:block;object-fit:contain;" />
        </div>
    `,
    speakerNotes: speakerNotes || "",
    slideType: "Reading",
    expectedTime,
});

const getImportedLessonName = (fileName = "") =>
    path
        .basename(fileName, path.extname(fileName))
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getUniqueLessonName = (baseName, existingNames = []) => {
    const normalizedNames = new Set(
        existingNames.map((name) => String(name || "").trim().toLowerCase()),
    );
    const normalizedBaseName = baseName.trim().toLowerCase();

    if (!normalizedNames.has(normalizedBaseName)) {
        return baseName;
    }

    let counter = 2;
    while (normalizedNames.has(`${normalizedBaseName} (${counter})`)) {
        counter += 1;
    }

    return `${baseName} (${counter})`;
};

exports.addLesson = async (req, res) => {
    const { chapterId, lessonName } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(chapterId) ) {
            return res.status(400).json({ message: 'Invalid chapterId ' });
          }
      
          // Convert string IDs to ObjectIds
          const chapterObjectId = new mongoose.Types.ObjectId(chapterId);
        const chapter = await Chapter.findById(chapterObjectId);

        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        if (!lessonName) {
            return res.status(400).json({ message: "Lesson name is required" });
        }

        const newLesson = new Lesson({
            chapterId,
            lessonName,
            slides: [] // No content yet, just creating with the name
        });

        await newLesson.save();
        chapter.lessons.push(newLesson._id);
        await chapter.save();

        res.status(201).json({
            message: "Lesson created successfully with just the name!",
            lesson: newLesson,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating lesson",
            error: error.message,
        });
    }
};

exports.importLessonPpt = async (req, res) => {
    const pptFile = req.file;
    const {
        chapterId,
        lessonId,
        lessonName,
        mode = "create",
        expectedTimePerSlide = 60,
    } = req.body;

    let outputDir = null;

    try {
        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({ message: "Valid chapterId is required" });
        }

        if (!pptFile) {
            return res.status(400).json({ message: "PPT file is required" });
        }

        const extension = path.extname(pptFile.originalname || "").toLowerCase();
        if (![".ppt", ".pptx"].includes(extension)) {
            return res.status(400).json({
                message: "Only .ppt and .pptx files are supported",
            });
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        const [speakerNotes, conversionResult] = await Promise.all([
            extractPptSpeakerNotes(pptFile.path),
            convertPptToPdf(pptFile.path),
        ]);
        const { pdfPath, outputDir: convertedOutputDir } = conversionResult;
        outputDir = convertedOutputDir;

        const pdfBuffer = await fs.promises.readFile(pdfPath);
        const pdfInfo = await pdfParse(pdfBuffer);
        const pageCount = Number(pdfInfo.numpages || 0);

        if (!pageCount) {
            return res.status(400).json({
                message: "Could not read any slides from this PPT",
            });
        }

        const uploadResult = await cloudinary.uploader.upload(pdfPath, {
            resource_type: "image",
            folder: "lesson_ppt_imports",
            public_id: `${String(chapter._id)}-${Date.now()}`,
            overwrite: true,
        });

        const perSlideTime = Math.max(0, Number(expectedTimePerSlide) || 60);
        const slides = Array.from({ length: pageCount }, (_, index) =>
            buildPptImageSlide(
                getCloudinaryPageUrl(uploadResult.public_id, index + 1),
                index + 1,
                pptFile.originalname,
                perSlideTime,
                speakerNotes[index],
            ),
        );

        const pptBaseName = getImportedLessonName(pptFile.originalname);
        let targetLessonName =
            lessonName?.trim() || pptBaseName || `${chapter.name} - Lesson Plan`;
        const chapterLessonIds = (chapter.lessons || []).map((id) => String(id));
        let lesson = null;

        if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
            lesson = await Lesson.findOne({
                _id: lessonId,
                chapterId: chapter._id,
            });
        }

        if (!lesson && mode === "create") {
            const existingLessons = await Lesson.find({
                _id: { $in: chapter.lessons },
                chapterId: chapter._id,
            }).select("lessonName");

            targetLessonName = getUniqueLessonName(
                targetLessonName,
                existingLessons.map((item) => item.lessonName),
            );
        }

        if (!lesson && mode !== "create") {
            const existingLessons = await Lesson.find({
                _id: { $in: chapter.lessons },
                chapterId: chapter._id,
            }).sort({ createdAt: 1 });

            lesson =
                existingLessons.find(
                    (item) =>
                        item.lessonName?.toLowerCase() ===
                        targetLessonName.toLowerCase(),
                ) ||
                existingLessons.find((item) =>
                    /lesson\s*plan/i.test(item.lessonName || ""),
                ) ||
                null;
        }

        if (!lesson) {
            lesson = new Lesson({
                chapterId: chapter._id,
                lessonName: targetLessonName,
                slides: [],
                lessonExpectedtime: 0,
            });
            await lesson.save();

            if (!chapterLessonIds.includes(String(lesson._id))) {
                chapter.lessons.push(lesson._id);
            }
        }

        const oldLessonExpectedtime = Number(lesson.lessonExpectedtime || 0);

        if (mode === "append") {
            lesson.slides = [...(lesson.slides || []), ...slides];
        } else {
            lesson.slides = slides;
        }

        lesson.lessonName = targetLessonName;
        lesson.lessonExpectedtime = lesson.slides.reduce(
            (total, slide) => total + Number(slide.expectedTime || 0),
            0,
        );

        const timeDifference = lesson.lessonExpectedtime - oldLessonExpectedtime;
        chapter.chapterExpectedtime =
            Number(chapter.chapterExpectedtime || 0) + timeDifference;

        await lesson.save();
        await chapter.save();

        if (chapter.course) {
            await Course.findByIdAndUpdate(chapter.course, {
                $inc: { courseExpectedtime: timeDifference },
            });
        }

        return res.status(201).json({
            success: true,
            message: `${pageCount} PPT slides imported as "${lesson.lessonName}"`,
            lesson,
            slideCount: pageCount,
            mode,
        });
    } catch (error) {
        console.error("Error importing lesson PPT:", error);
        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to import PPT. Please check the file and try again.",
        });
    } finally {
        const cleanupPaths = [pptFile?.path, outputDir].filter(Boolean);
        await Promise.all(
            cleanupPaths.map((targetPath) =>
                fs.promises.rm(targetPath, { recursive: true, force: true }).catch(() => {}),
            ),
        );
    }
};


exports.importLessonPdf = async (req, res) => {
    const pdfFile = req.file;

    const {
        chapterId,
        lessonId,
        lessonName,
        mode = "create",
        expectedTimePerSlide = 60,
    } = req.body;

    try {
        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({
                message: "Valid chapterId is required",
            });
        }

        if (!pdfFile) {
            return res.status(400).json({
                message: "PDF file is required",
            });
        }

        const extension = path
            .extname(pdfFile.originalname || "")
            .toLowerCase();

        if (extension !== ".pdf") {
            return res.status(400).json({
                message: "Only PDF files are supported",
            });
        }

        const chapter = await Chapter.findById(chapterId);

        if (!chapter) {
            return res.status(404).json({
                message: "Chapter not found",
            });
        }

        // Read PDF
        const pdfBuffer = await fs.promises.readFile(pdfFile.path);

        const pdfInfo = await pdfParse(pdfBuffer);

        const pageCount = Number(pdfInfo.numpages || 0);

        if (!pageCount) {
            return res.status(400).json({
                message: "Could not read any pages from this PDF",
            });
        }

        // Upload PDF to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
            pdfFile.path,
            {
                resource_type: "image",
                folder: "lesson_pdf_imports",
                public_id: `${String(chapter._id)}-${Date.now()}`,
                overwrite: true,
            }
        );

        const perSlideTime =
            Math.max(0, Number(expectedTimePerSlide) || 60);

        // Create one lesson slide for each PDF page
        const slides = Array.from(
            { length: pageCount },
            (_, index) =>
                buildPptImageSlide(
                    getCloudinaryPageUrl(
                        uploadResult.public_id,
                        index + 1
                    ),
                    index + 1,
                    pdfFile.originalname,
                    perSlideTime,
                    ""
                )
        );

        // Lesson name from PDF filename
        const pdfBaseName = getImportedLessonName(
            pdfFile.originalname
        );

        let targetLessonName =
            lessonName?.trim() ||
            pdfBaseName ||
            `${chapter.name} - Lesson Plan`;

        const chapterLessonIds = (chapter.lessons || []).map(
            (id) => String(id)
        );

        let lesson = null;

        // If existing lesson ID is provided
        if (
            lessonId &&
            mongoose.Types.ObjectId.isValid(lessonId)
        ) {
            lesson = await Lesson.findOne({
                _id: lessonId,
                chapterId: chapter._id,
            });
        }

        // Create new lesson
        if (!lesson && mode === "create") {
            const existingLessons = await Lesson.find({
                _id: { $in: chapter.lessons },
                chapterId: chapter._id,
            }).select("lessonName");

            targetLessonName = getUniqueLessonName(
                targetLessonName,
                existingLessons.map(
                    (item) => item.lessonName
                )
            );
        }

        // Find lesson when not creating
        if (!lesson && mode !== "create") {
            const existingLessons = await Lesson.find({
                _id: { $in: chapter.lessons },
                chapterId: chapter._id,
            }).sort({ createdAt: 1 });

            lesson =
                existingLessons.find(
                    (item) =>
                        item.lessonName?.toLowerCase() ===
                        targetLessonName.toLowerCase()
                ) ||
                existingLessons.find((item) =>
                    /lesson\s*plan/i.test(
                        item.lessonName || ""
                    )
                ) ||
                null;
        }

        // Create lesson if it doesn't exist
        if (!lesson) {
            lesson = new Lesson({
                chapterId: chapter._id,
                lessonName: targetLessonName,
                slides: [],
                lessonExpectedtime: 0,
            });

            await lesson.save();

            if (
                !chapterLessonIds.includes(
                    String(lesson._id)
                )
            ) {
                chapter.lessons.push(lesson._id);
            }
        }

        const oldLessonExpectedtime = Number(
            lesson.lessonExpectedtime || 0
        );

        // Append or replace slides
        if (mode === "append") {
            lesson.slides = [
                ...(lesson.slides || []),
                ...slides,
            ];
        } else {
            lesson.slides = slides;
        }

        lesson.lessonName = targetLessonName;

        lesson.lessonExpectedtime =
            lesson.slides.reduce(
                (total, slide) =>
                    total +
                    Number(slide.expectedTime || 0),
                0
            );

        const timeDifference =
            lesson.lessonExpectedtime -
            oldLessonExpectedtime;

        chapter.chapterExpectedtime =
            Number(chapter.chapterExpectedtime || 0) +
            timeDifference;

        await lesson.save();
        await chapter.save();

        if (chapter.course) {
            await Course.findByIdAndUpdate(
                chapter.course,
                {
                    $inc: {
                        courseExpectedtime: timeDifference,
                    },
                }
            );
        }

        return res.status(201).json({
            success: true,
            message: `${pageCount} PDF pages imported as "${lesson.lessonName}"`,
            lesson,
            slideCount: pageCount,
            mode,
        });

    } catch (error) {
        console.error(
            "Error importing lesson PDF:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to import PDF. Please check the file and try again.",
        });
    } finally {
        if (pdfFile?.path) {
            await fs.promises
                .rm(pdfFile.path, {
                    force: true,
                })
                .catch(() => {});
        }
    }
};


// deleting lesson from DB and reference from chapter
exports.deleteLesson = async (req, res) => {
    const { lessonId } = req.params;

    try {
        // Find the lesson
        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Find the associated chapter
        const chapter = await Chapter.findById(lesson.chapterId);

        if (!chapter) {
            return res.status(404).json({ message: "Associated chapter not found" });
        }

        // Remove the lesson reference from the chapter
        chapter.lessons = chapter.lessons.filter(id => id.toString() !== lessonId);
        await chapter.save();

        // Delete the lesson
        await Lesson.findByIdAndDelete(lessonId);

        res.status(200).json({
            message: "Lesson deleted successfully and removed from chapter",
            deletedLessonId: lessonId
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting lesson",
            error: error.message
        });
    }
};


exports.updateLesson = async (req, res) => {
    const { lessonId } = req.params; 
    const { slides, lessonName } = req.body;

    try {
        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({ 
                success: false,
                message: "Lesson not found" 
            });
        }

        // Store old lessonExpectedtime for calculating difference
        const oldLessonExpectedtime = lesson.lessonExpectedtime;

        // Update lesson name if provided
        if (lessonName) {
            lesson.lessonName = lessonName;
        }

        // Update slides if provided
        if (slides && Array.isArray(slides)) {
            lesson.slides = slides.map(slide => ({
                content: slide.content || "",
                speakerNotes: slide.speakerNotes || "",
                slideType: slide.slideType || "",
                expectedTime: slide.expectedTime || 0,
                selectedQuestion: slide.selectedQuestion || null,
                quizId: slide.quizId || null
            }));

            // Calculate total expected time from all slides
            const totalExpectedTime = lesson.slides.reduce((total, slide) => {
                return total + (slide.expectedTime || 0);
            }, 0);

            // Update lessonExpectedtime
            lesson.lessonExpectedtime = totalExpectedTime;

            // Get the chapter and its course
            const chapter = await Chapter.findById(lesson.chapterId);
            if (chapter) {
                // Calculate the difference in lesson time
                const timeDifference = totalExpectedTime - oldLessonExpectedtime;
                
                // Add the difference to chapter total time
                chapter.chapterExpectedtime = (chapter.chapterExpectedtime || 0) + timeDifference;

                // Get the course
                const course = await Course.findById(chapter.course);
                if (course) {
                    // Add the same difference to course total time
                    course.courseExpectedtime = (course.courseExpectedtime || 0) + timeDifference;
                    await course.save();
                }
                
                await chapter.save();
            }
        }

        await lesson.save();

        res.status(200).json({
            success: true,
            message: "Lesson, chapter, and course times updated successfully",
            lesson: lesson
        });
    } catch (error) {
        console.error("Error in updateLesson:", error);
        res.status(500).json({
            success: false,
            message: "Error updating lesson",
            error: error.message
        });
    }
};

// Get lessons by chapterId
exports.getLessonsByChapter = async (req, res) => {
    const { chapterId } = req.params;

    try {
        const lessons = await Lesson.find({ chapterId }).sort({ createdAt: 1 });
        res.status(200).json({ lessons });
    } catch (error) {
        res.status(500).json({ message: "Error fetching lessons", error });
    }
};

// Get single lesson
exports.getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        res.json(lesson);  // Send the entire lesson object
    } catch (error) {
        res.status(500).json({ message: "Error retrieving lesson", error: error.message });
    }
};

exports.deleteLesson = async (req, res) => {
    const { lessonId } = req.params;

    try {
        // Find and delete the lesson
        const deletedLesson = await Lesson.findByIdAndDelete(lessonId);

        if (!deletedLesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Find the corresponding chapter
        const chapter = await Chapter.findById(deletedLesson.chapterId);

        if (!chapter) {
            return res.status(404).json({ message: "Associated chapter not found" });
        }

        // Remove the lesson ID from the chapter's lessons array
        chapter.lessons = chapter.lessons.filter(
            (lesson) => lesson.toString() !== lessonId
        );

        // Save the updated chapter
        await chapter.save();

        res.status(200).json({
            message: "Lesson deleted successfully and removed from chapter",
            deletedLesson,
        });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        res.status(500).json({ message: "Error deleting lesson", error: error.message });
    }
};


exports.getStudentCourseProgress = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        const courseProgress = await StudentCourseProgress.findOne({ 
            studentId,
            courseId
        });

        if (!courseProgress) {
            return res.status(200).json({
                studentId,
                courseId,
                courseUTS: 0,
            });
        }

        return res.status(200).json(courseProgress);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.getStudentReleasedCourseProgress = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const { batchId } = req.query;

        if (!batchId) {
            return res.status(400).json({ message: "batchId is required" });
        }

        const course = await Course.findById(courseId)
            .populate({
                path: "chapters",
                select: "_id name Ebook EbookExpectedtime videoExpectedtime videoLessons",
            })
            .lean();

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const chapterIds = (course.chapters || []).map((chapter) => chapter._id);

        if (!chapterIds.length) {
            return res.status(200).json({
                studentId,
                courseId,
                batchId,
                progress: 0,
                releasedChapters: 0,
                totalChapters: 0,
                measurableChapters: 0,
                chapters: [],
            });
        }

        const [accessDocs, chapterProgressList] = await Promise.all([
            BatchChapterAccess.find({
                batchId,
                courseId,
                chapterId: { $in: chapterIds },
            }).lean(),
            StudentChapterProgress.find({
                studentId,
                chapterId: { $in: chapterIds },
            }).lean(),
        ]);

        const accessByChapter = new Map(
            accessDocs.map((doc) => [String(doc.chapterId), doc])
        );
        const progressByChapter = new Map(
            chapterProgressList.map((doc) => [String(doc.chapterId), doc])
        );

        const chapterSummaries = (course.chapters || []).map((chapter) => {
            const chapterId = String(chapter._id);
            const access = accessByChapter.get(chapterId);
            const isReleased = Boolean(access?.chapterEnabled);
            const progress = progressByChapter.get(chapterId);
            const itemPercents = [];

            if (isReleased && access?.ebookEnabled !== false && chapter.Ebook && Number(chapter.EbookExpectedtime || 0) > 0) {
                itemPercents.push(
                    Math.min(100, Math.round((Number(progress?.EbookUTS || 0) / Number(chapter.EbookExpectedtime || 0)) * 100))
                );
            }

            if (isReleased && access?.videoEnabled !== false && (chapter.videoLessons || []).length > 0 && Number(chapter.videoExpectedtime || 0) > 0) {
                itemPercents.push(
                    Math.min(100, Math.round((Number(progress?.videoUTS || 0) / Number(chapter.videoExpectedtime || 0)) * 100))
                );
            }

            const measurable = itemPercents.length > 0;
            const percent = measurable
                ? Math.round(itemPercents.reduce((sum, value) => sum + value, 0) / itemPercents.length)
                : 0;

            return {
                chapterId,
                name: chapter.name,
                released: isReleased,
                measurable,
                percent,
            };
        });

        const releasedChapters = chapterSummaries.filter((chapter) => chapter.released);
        const measurableReleasedChapters = releasedChapters.filter((chapter) => chapter.measurable);
        const progress = measurableReleasedChapters.length
            ? Math.round(
                measurableReleasedChapters.reduce((sum, chapter) => sum + chapter.percent, 0) /
                measurableReleasedChapters.length
            )
            : 0;

        return res.status(200).json({
            studentId,
            courseId,
            batchId,
            progress,
            releasedChapters: releasedChapters.length,
            totalChapters: chapterSummaries.length,
            measurableChapters: measurableReleasedChapters.length,
            chapters: chapterSummaries,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


exports.lessonTimespend = async (req, res) => {
    try {
        const { lessonId, studentId, slideIndex, timeSpent } = req.body;

        // Input validation
        if (!lessonId || !studentId || slideIndex === undefined || !timeSpent) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get lesson to check expected time for the slide
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        // Get the expected time for this specific slide using array index
        if (!lesson.slides[slideIndex]) {
            return res.status(404).json({
                success: false,
                message: `Slide with index ${slideIndex} not found in lesson`
            });
        }

        const expectedTime = lesson.slides[slideIndex].expectedTime || 0;
        // Always start by limiting time to expected time
        let effectiveTimeSpent = expectedTime > 0 ? Math.min(timeSpent, expectedTime) : timeSpent;

        // Find or create student progress
        let studentProgress = await StudentSlideProgress.findOne({
            lessonId,
            studentId
        });

        if (!studentProgress) {
            // Create new progress with limited time
            studentProgress = new StudentSlideProgress({
                lessonId,
                studentId,
                lessonUTS: effectiveTimeSpent,
                slideProgress: [{
                    slideIndex,
                    timeSpent: effectiveTimeSpent
                }]
            });
        } else {
            // Find existing progress for this slide
            const existingSlideIndex = studentProgress.slideProgress.findIndex(
                slide => slide.slideIndex === slideIndex
            );

            if (existingSlideIndex !== -1) {
                // Get existing time spent
                const existingTime = studentProgress.slideProgress[existingSlideIndex].timeSpent;

                // If there's an expected time limit
                if (expectedTime > 0) {
                    // Calculate remaining allowed time
                    const remainingTime = Math.max(0, expectedTime - existingTime);
                    effectiveTimeSpent = Math.min(timeSpent, remainingTime);
                }

                if (effectiveTimeSpent > 0) {
                    studentProgress.slideProgress[existingSlideIndex].timeSpent += effectiveTimeSpent;
                } else {
                    effectiveTimeSpent = 0; // No more time can be added
                }
            } else {
                // No existing progress for this slide, add new entry with limited time
                studentProgress.slideProgress.push({
                    slideIndex,
                    timeSpent: effectiveTimeSpent
                });
            }

            // Update total lesson time
            studentProgress.lessonUTS = studentProgress.slideProgress.reduce(
                (sum, slide) => sum + (slide.timeSpent || 0),
                0
            );
        }

        // If no time was added
        if (effectiveTimeSpent === 0) {
            return res.status(200).json({
                success: true,
                message: "Maximum time limit reached for this slide",
                data: {
                    slideIndex,
                    expectedTime,
                    currentTimeSpent: studentProgress.slideProgress.find(
                        slide => slide.slideIndex === slideIndex
                    )?.timeSpent || 0
                }
            });
        }

        // Save the updated progress
        await studentProgress.save();

        // Get and update chapter progress
        const chapter = await Chapter.findById(lesson.chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        const allLessonProgress = await StudentSlideProgress.find({
            studentId,
            lessonId: { $in: chapter.lessons }
        });

        const chapterExpectedtime = allLessonProgress.reduce(
            (sum, progress) => sum + (progress.lessonUTS || 0),
            0
        );

        const chapterProgress = await StudentChapterProgress.findOneAndUpdate(
            {
                studentId,
                chapterId: lesson.chapterId
            },
            {
                $set: { chapterUTS: chapterExpectedtime }
            },
            { upsert: true, new: true }
        );

        // Get and update course progress
        const course = await Course.findById(chapter.course);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const existingCourseProgress = await StudentCourseProgress.findOne({
            studentId,
            courseId: course._id
        });

        const courseExpectedtime = effectiveTimeSpent + (existingCourseProgress?.courseUTS || 0);

        const courseProgress = await StudentCourseProgress.findOneAndUpdate(
            {
                studentId,
                courseId: course._id
            },
            {
                $set: { courseUTS: courseExpectedtime }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Progress updated successfully",
            data: {
                slideIndex,
                timeAdded: effectiveTimeSpent,
                ExpectedtimeForSlide: studentProgress.slideProgress.find(
                    slide => slide.slideIndex === slideIndex
                )?.timeSpent,
                expectedTime,
                lessonProgress: studentProgress,
                chapterProgress,
                courseProgress
            }
        });

    } catch (error) {
        console.error("Error in lessonTimespend:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating progress",
            error: error.message
        });
    }
};



exports.updateEbookTime = async (req, res) => {
    try {
        const { chapterId, studentId, ebooktimeSpent } = req.body;

        // Input validation
        if (!chapterId || !studentId || !ebooktimeSpent) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get chapter
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        // Get expected ebook time from chapter
        const ebookExpectedTime = chapter.EbookExpectedtime;

        // Get or create chapter progress
        let chapterProgress = await StudentChapterProgress.findOne({
            chapterId,
            studentId
        });

        // Calculate how much time should be actually added
        let timeToAdd = 0;
        if (!chapterProgress) {
            // For new progress, add the minimum of ebooktimeSpent and ebookExpectedTime
            timeToAdd = Math.min(ebooktimeSpent, ebookExpectedTime);
            chapterProgress = new StudentChapterProgress({
                studentId,
                chapterId,
                EbookUTS: timeToAdd,
                chapterUTS: 0
            });
        } else {
            // For existing progress, calculate remaining time
            const remainingTime = ebookExpectedTime - chapterProgress.EbookUTS;
            if (remainingTime > 0) {
                // Only add time if we haven't reached the expected time
                timeToAdd = Math.min(ebooktimeSpent, remainingTime);
                chapterProgress.EbookUTS += timeToAdd;
            }
        }

        await chapterProgress.save();

        // Only update course progress if we actually added some time
        if (timeToAdd > 0 && chapter.course) {
            await StudentCourseProgress.findOneAndUpdate(
                {
                    studentId,
                    courseId: chapter.course
                },
                {
                    $inc: { courseUTS: timeToAdd }  // Add the calculated time to course total
                },
                { upsert: true, new: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Ebook time updated successfully",
            data: { 
                chapterProgress,
                timeAdded: timeToAdd,
                isExpectedTimeReached: chapterProgress.EbookUTS >= ebookExpectedTime
            }
        });

    } catch (error) {
        console.error("Error in updateEbookTime:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating ebook time",
            error: error.message
        });
    }
};


exports.updateVideoTime = async (req, res) => {
    try {
        const { chapterId, studentId, videoIndex, videoTimeSpent } = req.body;

        // Input validation
        if (!chapterId || !studentId || videoIndex === undefined || !videoTimeSpent) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get chapter first
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        // Validate video index
        if (videoIndex < 0 || videoIndex >= chapter.videoLessons.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid video index"
            });
        }

        // Get videoId from chapter's videoLessons array
        const videoId = chapter.videoLessons[videoIndex];
        
        // Get video and check if it exists
        const video = await VideoContent.findById(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        // Get or create video progress
        let videoProgress = await VideoProgress.findOne({
            videoId,
            studentId,
            chapterId
        });

        // Calculate time to add for this specific video
        let timeToAdd = 0;
        if (!videoProgress) {
            timeToAdd = Math.min(videoTimeSpent, video.expectedTime);
            videoProgress = new VideoProgress({
                studentId,
                videoId,
                chapterId,
                timeSpent: timeToAdd
            });
        } else {
            const remainingTime = video.expectedTime - videoProgress.timeSpent;
            if (remainingTime > 0) {
                timeToAdd = Math.min(videoTimeSpent, remainingTime);
                videoProgress.timeSpent += timeToAdd;
            }
        }

        await videoProgress.save();

        // Get all video progress for this chapter and student
        const allVideoProgress = await VideoProgress.find({
            studentId,
            chapterId
        });

        // Calculate total time spent on all videos
        const totalVideoTime = allVideoProgress.reduce((sum, progress) => 
            sum + progress.timeSpent, 0
        );

        // Update chapter progress
        let chapterProgress = await StudentChapterProgress.findOne({
            chapterId,
            studentId
        });

        if (!chapterProgress) {
            chapterProgress = new StudentChapterProgress({
                studentId,
                chapterId,
                videoUTS: totalVideoTime,
                chapterUTS: 0
            });
        } else {
            chapterProgress.videoUTS = totalVideoTime;
        }

        await chapterProgress.save();

        // Update course progress if time was added
        if (timeToAdd > 0 && chapter.course) {
            await StudentCourseProgress.findOneAndUpdate(
                {
                    studentId,
                    courseId: chapter.course
                },
                {
                    $inc: { courseUTS: timeToAdd }
                },
                { upsert: true, new: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Video time updated successfully",
            data: {
                videoProgress,
                chapterProgress,
                timeAdded: timeToAdd,
                isVideoExpectedTimeReached: videoProgress.timeSpent >= video.expectedTime,
                totalChapterVideoTime: totalVideoTime,
                videoIndex: videoIndex
            }
        });

    } catch (error) {
        console.error("Error in updateVideoTime:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating video time",
            error: error.message
        });
    }
};



// Get time spent on a specific video by a student
exports.getVideoTimeSpent = async (req, res) => {
    try {
        const { studentId, videoIndex, chapterId } = req.params;

        // Validate MongoDB ObjectIds and videoIndex
        if (!mongoose.Types.ObjectId.isValid(studentId) || 
            !mongoose.Types.ObjectId.isValid(chapterId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format provided"
            });
        }

        if (videoIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: "Video index is required"
            });
        }

        // Get chapter first
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found"
            });
        }

        // Validate video index
        if (videoIndex < 0 || videoIndex >= chapter.videoLessons.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid video index"
            });
        }

        // Get videoId from chapter's videoLessons array
        const videoId = chapter.videoLessons[videoIndex];
        
        // Get video and check if it exists
        const video = await VideoContent.findById(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        // Find the video progress record
        const videoProgress = await VideoProgress.findOne({
            studentId,
            videoId,
            chapterId
        });

        // If no progress record exists
        if (!videoProgress) {
            return res.status(200).json({
                success: true,
                message: "No progress record found for this video",
                data: {
                    timeSpent: 0,
                    isProgressExists: false,
                    videoId,
                    videoIndex
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Video progress retrieved successfully",
            data: {
                timeSpent: videoProgress.timeSpent,
                isProgressExists: true,
                progressRecord: videoProgress,
                videoId,
                videoIndex
            }
        });

    } catch (error) {
        console.error("Error in getVideoTimeSpent:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving video progress",
            error: error.message
        });
    }
};
