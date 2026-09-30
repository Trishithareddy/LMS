const express = require("express");

const {
    startAttendanceSession,
    getBatchAttendance,
    saveAttendance,
    autoMarkAttendance,
    closeAttendanceSession,
    getAttendanceSummary,
    getTodayAttendanceStatus,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const eitherOr = require("../middleware/eitherOr");

const router = express.Router();

const allowTeacherOrAdmin = eitherOr(authMiddleware, authTeacherMiddleware);
const allowStudentOrTeacherOrAdmin = eitherOr(
    authMiddleware,
    authTeacherMiddleware,
    authStudentMiddleware
);

router.post(
    "/session/start",
    allowTeacherOrAdmin,
    startAttendanceSession
);

router.patch(
    "/session/:sessionId/close",
    allowTeacherOrAdmin,
    closeAttendanceSession
);

router.get(
    "/batch/:batchId",
    allowStudentOrTeacherOrAdmin,
    getBatchAttendance
);

router.post(
    "/save",
    allowTeacherOrAdmin,
    saveAttendance
);

router.post(
    "/auto-mark",
    allowStudentOrTeacherOrAdmin,
    autoMarkAttendance
);

router.get(
    "/summary/:batchId",
    allowTeacherOrAdmin,
    getAttendanceSummary
);

router.get(
    "/today/status",
    allowStudentOrTeacherOrAdmin,
    getTodayAttendanceStatus
);

module.exports = router;