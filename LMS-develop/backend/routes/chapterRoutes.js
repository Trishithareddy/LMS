const express = require("express");
const generationIdempotency = require("../middleware/generationIdempotency");
const protectGeneration = generationIdempotency({ cacheMs: 60 * 60 * 1000 });
const router = express.Router();
const {
    createChapter,
    getAllChapters,
    getChapterById,
    updateChapter,
    addExistingChapterToCourse,
    addEbook,
    deleteChapter,
    // addWorksheet,
    addWorksheetFile,
    addEbookByCloudPdfDocumentId,
    addTerminalOptions,
    addWorksheetByCloudPdfDocumentId,
    createFolder,
    getFoldersByChapterAndParent,
    updateFolderName,
    addFileByCloudPdfDocumentId,
    getFilesByChapterAndFolder,
    updateFileName,
    downloadPDFFromCloudPDF,
    chatWithPdf,
    generateAiraContent,
    deleteFolderById,
    deleteFileById,
    toggleFileStatus,
    getChapterInstructions,
    getChaptersByCourse,
    assignSkillTestAndBadge,
    assignSkillTestToChapter,
    updateChapterInstructions,
    generateAiraLessonPlan,
    generateAiraCustomLessonPlan,
    getBatchChapterAccessMap,
    updateBatchChapterAccess,
    testExtractTextbookImages,
    testExtractedImages,
} = require("../controllers/chapterController");
const {
    addLabActivity,
    addLabActivityByCloudPdfDocumentId,
    getLabActivity,
    deleteLabActivityPdf
} = require("../controllers/labActivityController");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure you have this middleware
const eitherOr = require('../middleware/eitherOr');


//multer for handling eBook
const upload = require("../middleware/multer");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const multer = require("multer");

const customLessonTemplateUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const fileName = String(file.originalname || "").toLowerCase();
        const mimeType = String(file.mimetype || "").toLowerCase();

        const isPdf =
            mimeType.includes("pdf") || fileName.endsWith(".pdf");

        const isDocx =
            mimeType.includes("wordprocessingml") ||
            fileName.endsWith(".docx");

        if (!isPdf && !isDocx) {
            return cb(
                new Error("Only PDF and DOCX files are allowed"),
                false
            );
        }

        cb(null, true);
    },
});
// Route to create a new chapter under a specific course
router.post("/:courseId/addChapter", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), createChapter);



// Route to get all chapters
router.get("/getAllChapters", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getAllChapters);

router.get("/by-course", getChaptersByCourse);
router.get(
    "/batch-access-map",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getBatchChapterAccessMap
);
router.put(
    "/batch-access-map",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    updateBatchChapterAccess
);

router.get(
    "/test-extract-images",
    (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Textbook Image Extraction Test</title>
            </head>

            <body>

                <h2>Textbook Image Extraction Test</h2>

                <form
                    action="/chapters/test-extract-images"
                    method="POST"
                    enctype="multipart/form-data"
                >

                    <input
                        type="file"
                        name="ebook"
                        accept=".pdf"
                        required
                    />

                    <button type="submit">
                        Extract Images
                    </button>

                </form>

            </body>
            </html>
        `);
    }
);
router.post(
    "/test-extract-images",
    upload.single("ebook"),
    testExtractTextbookImages
);

router.get(
  "/test-extracted-images",
  testExtractedImages
);

// Route to get a chapter by its ID
router.get("/:chapterId", getChapterById);

// Route to update a chapter by its ID
router.put("/updateChapter/:id", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), updateChapter);

// Route to add an existing chapter to a course
router.post("/:courseId/add-existing-chapter",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), addExistingChapterToCourse);

// to delete a chapter and all its contents
router.delete("/deleteChapter/:id", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteChapter);

//route to add ebook to a chapter
router.put("/addEbook", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),upload.single("ebook"), addEbook);


// char with pdf
router.post(
    "/chatPdf",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    protectGeneration,
    chatWithPdf
);
router.post(
    "/aira/lesson-plan",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    protectGeneration,
    generateAiraLessonPlan
);


router.post(
    "/aira/lesson-plan/custom-format",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    customLessonTemplateUpload.single("templateFile"),
    protectGeneration,
    generateAiraCustomLessonPlan
);

// AIRA generator tools using existing ChatPDF sourceId
router.post(
    "/aira/generate",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    protectGeneration,
    generateAiraContent
);

//route to add e-book via document id
router.post("/addEbookById",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), addEbookByCloudPdfDocumentId);

//route to add worksheet to a chapter
// router.put("/addWorksheet", addWorksheet);

// route to add worksheet file 
router.put("/addWorksheet",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), upload.single("worksheet"), addWorksheetFile);

// route to add worksheet document id 
router.post('/addWorksheetById',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),addWorksheetByCloudPdfDocumentId)

//route to add terminal in a chapter

router.put("/addTerminal",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), addTerminalOptions);

router.post('/create/folder',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),createFolder)

router.get('/get/folders/:chapterId/:parentId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getFoldersByChapterAndParent)

router.put('/rename/folder/:id',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),updateFolderName)

router.post('/addFileBy/documentId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),addFileByCloudPdfDocumentId)

router.get('/get/files/:chapterId/:folderId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getFilesByChapterAndFolder)

router.put('/rename/file/:id',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),updateFileName)

router.delete('/delete/folder/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteFolderById)

router.delete('/delete/file/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteFileById)

router.put('/toggle/file/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),toggleFileStatus)

router.put(
  "/:chapterId/assign-skilltest",
  assignSkillTestAndBadge
);

// router.put(
//   "/chapters/:chapterId/assign-skilltest",
//   assignSkillTestToChapter
// );


// 👇 NEW: read instructions (allow any logged-in role)
router.get(
  "/:chapterId/instructions",
  eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
  getChapterInstructions
);



// 👇 NEW: update instructions (superadmin only)
router.put(
  "/:chapterId/instructions",
  authMiddleware,           // must be authenticated first
  requireAdmin,        // then role-check
  updateChapterInstructions
);
// router.get('/download/:documentId',downloadPDFFromCloudPDF);

// Lab Activity routes from here:
router.post('/lab-activity/add',  eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), upload.single('pdf'), addLabActivity);  // For uploading new PDF
router.post('/lab-activity/add-by-id',  eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), addLabActivityByCloudPdfDocumentId);  // For adding existing CloudPDF document
router.delete('/lab-activity/pdf', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),deleteLabActivityPdf);  // For deleting a PDF from lab activity
router.get('/lab-activity/:chapterId',  eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getLabActivity);  // For getting lab activity by chapter ID


module.exports = router;
