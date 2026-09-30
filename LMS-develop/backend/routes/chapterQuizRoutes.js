const express = require("express")
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware'); // Ensure you have this middleware
const eitherOr = require('../middleware/eitherOr');
const authStudentMiddleware = require('../middleware/authStudentMiddleware');
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');
const generationIdempotency = require("../middleware/generationIdempotency");
const protectGeneration = generationIdempotency({ cacheMs: 5 * 60 * 1000 });
const {
    createChapterQuiz,
    getChapterQuizByChapterId,
    updateChapterQuiz,
    deleteChapterQuiz,
    submitChapterQuizAttempt,
    getQuizAttemptDetails,
    getSingleQuizWithStatus,
    generateAiraChapterQuiz,
} = require("../controllers/chapterQuizController");


router.post("/create-quiz",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),createChapterQuiz)
router.post(
    "/aira-generate-quiz",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    protectGeneration,
    generateAiraChapterQuiz
);
router.get("/get-chapter-quiz/:id",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getChapterQuizByChapterId)
router.get("/get-chapter-quizstatus/:chapterId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getSingleQuizWithStatus)
router.patch("/update-chapter-quiz/:id",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),updateChapterQuiz)
router.delete("/delete-chapter-quiz/:id",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),deleteChapterQuiz)
router.post("/submit-chapter-quiz",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),submitChapterQuizAttempt)
router.get("/get-submitted-chapter-quiz/:attemptId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getQuizAttemptDetails)


module.exports = router;
