const express = require("express");
const router = express.Router();
const {  createQuiz, createQuizValidation, getQuizAttemptDetails, reviewQuizAttempt, getQuizzes, submitQuizAttempt,updateQuiz, updateQuizValidation, deleteQuiz, createQuizgetQuizById, getQuizzesWithStatus,getBatchForQuiz, getBatchAndQuiz,getBatchAttempts, getQuizAnalytics, duplicateQuiz, getQuizForAttempt } = require("../controllers/quizController");
const eitherOr = require('../middleware/eitherOr');
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const { downloadQuizReport } = require("../controllers/reportDownloadController");



// Quiz CRUD operations
router.post("/create", authTeacherMiddleware, createQuizValidation, createQuiz);
router.get("/get-all-quizzes",authTeacherMiddleware, getQuizzes);
router.get("/get-quizzes",eitherOr( authTeacherMiddleware, authStudentMiddleware), getQuizzesWithStatus);
router.get("/get-single-quiz/:id",eitherOr( authTeacherMiddleware, authStudentMiddleware),createQuizgetQuizById);
router.put("/update/:id",authTeacherMiddleware, updateQuizValidation, updateQuiz);
router.delete("/delete/:id",authTeacherMiddleware, deleteQuiz);
router.get("/analytics/:id", authTeacherMiddleware, getQuizAnalytics);
router.post("/duplicate/:id", authTeacherMiddleware, duplicateQuiz);

// // Quiz management operations
router.get("/attempt-quiz/:quizId", authStudentMiddleware, getQuizForAttempt);
router.post("/attempt/submit", authStudentMiddleware, submitQuizAttempt);
router.get("/attempt/:attemptId",eitherOr( authTeacherMiddleware, authStudentMiddleware), getQuizAttemptDetails);
router.put("/attempt/:attemptId/review", authTeacherMiddleware, reviewQuizAttempt);
router.get("/submitted", eitherOr( authTeacherMiddleware, authStudentMiddleware),getBatchAttempts);
router.get("/get-batch-for-quiz",authTeacherMiddleware ,getBatchForQuiz);

router.get('/report/:quizId/download/pdf',eitherOr( authTeacherMiddleware, authStudentMiddleware),downloadQuizReport);

module.exports = router;
