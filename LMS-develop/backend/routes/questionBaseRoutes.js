const express = require("express");
const {
    createQuestionBase,
    createBoard,
    createGrade,
    getAllBoards,
    getAllGrades,
    createConcept,
    fetchAllConceptsByChapterId,
    fetchQuestionById,
    fetchQuestions,
    deleteQuestionById,
    updateQuestionBase,
    fetchfilteredQuestions,
    getQuestionPdf,
    getQuestionsForSections,
    generateSmartQuestions,
    generateCustomFormatQuestionPaper,
    regenerationOfQuestion,
    getQuestionDistributionByChapter,
    fetchQuestionsForCreateQuiz,
} = require("../controllers/questionBaseController");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure you have this middleware

const router = express.Router();
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const eitherOr = require("../middleware/eitherOr");
const multer = require("multer");
const generationIdempotency = require("../middleware/generationIdempotency");
const protectGeneration = generationIdempotency({ cacheMs: 5 * 60 * 1000 });

const questionPaperFormatUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const fileName = String(file.originalname || "").toLowerCase();
        const mimeType = String(file.mimetype || "").toLowerCase();

        const isPdf = mimeType.includes("pdf") || fileName.endsWith(".pdf");
        const isDocx =
            mimeType.includes("wordprocessingml") ||
            fileName.endsWith(".docx");

        if (!isPdf && !isDocx) {
            return cb(new Error("Only PDF and DOCX files are allowed"), false);
        }

        cb(null, true);
    },
});
//eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware)

router.post(
    "/create/questionBase",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    createQuestionBase,
);
router.post(
    "/board/create",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    createBoard,
);
router.post(
    "/grade/create",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    createGrade,
);
router.get(
    "/get/allBoards",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getAllBoards,
);
router.get(
    "/get/allGrades",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getAllGrades,
);
// router.post('/concept/create/:chapterId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),createConcept);
// router.get('/get/allConcepts/:chapterId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),fetchAllConceptsByChapterId);
router.get(
    "/get/questionDetails/:id",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    fetchQuestionById,
);
router.get(
    "/get/allQuestions",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    fetchQuestions,
);
router.delete(
    "/delete/question/:id",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    deleteQuestionById,
);
router.put(
    "/edit/questionBase/:questionId",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    updateQuestionBase,
);
router.get(
    "/filter/questionBases",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    fetchfilteredQuestions,
);
router.get(
    "/questionspdf",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getQuestionPdf,
);
router.post(
    "/generate/random/questions",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getQuestionsForSections,
);

router.post(
    "/generate/smart/questions",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    protectGeneration,
    generateSmartQuestions,
);

router.post(
    "/generate/custom-format/question-paper",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    questionPaperFormatUpload.single("templateFile"),
    protectGeneration,
    generateCustomFormatQuestionPaper,
);

router.get(
    "/generate/random/questionOfASection",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    regenerationOfQuestion,
);

router.get(
    "/generate/getChapterById/:qbChapterId",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getQuestionDistributionByChapter,
);
router.get(
    "/quiz/questionBases",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    fetchQuestionsForCreateQuiz,
);

module.exports = router;
