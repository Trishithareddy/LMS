const express = require("express");

const {
    getBatchPerformanceDashboard,
} = require("../controllers/performanceController");

const authMiddleware = require("../middleware/authMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const eitherOr = require("../middleware/eitherOr");

const router = express.Router();

const allowTeacherOrAdmin = eitherOr(authMiddleware, authTeacherMiddleware);

router.post(
    "/batch-dashboard",
    allowTeacherOrAdmin,
    getBatchPerformanceDashboard
);

module.exports = router;