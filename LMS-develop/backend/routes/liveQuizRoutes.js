const express = require("express");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const eitherOr = require("../middleware/eitherOr");
const {
    createLiveQuizSession,
    getTeacherLiveQuizSessions,
    getLiveQuizSession,
    updateLiveQuizSessionStatus,
    joinLiveQuizSession,
    updateLiveQuizProgress,
} = require("../controllers/liveQuizController");

const router = express.Router();

router.post("/sessions", authTeacherMiddleware, createLiveQuizSession);
router.get("/sessions", authTeacherMiddleware, getTeacherLiveQuizSessions);
router.get(
    "/sessions/:id",
    eitherOr(authTeacherMiddleware, authStudentMiddleware),
    getLiveQuizSession,
);
router.patch(
    "/sessions/:id/status",
    authTeacherMiddleware,
    updateLiveQuizSessionStatus,
);
router.post("/join", authStudentMiddleware, joinLiveQuizSession);
router.post("/progress", authStudentMiddleware, updateLiveQuizProgress);

module.exports = router;
