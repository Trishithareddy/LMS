const express = require("express");
const router = express.Router();

const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");

const {
    upsertLessonProgress,
    getLessonProgress,
} = require("../controllers/teacherLessonProgressController");

router.put("/lesson", authTeacherMiddleware, upsertLessonProgress);

router.get("/lessons", authTeacherMiddleware, getLessonProgress);

module.exports = router;