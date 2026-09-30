const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authSchoolAdminMiddleware = require("../middleware/authSchoolAdminMiddleware");
const eitherOr = require("../middleware/eitherOr");

router.get("/monthly-usage", reportController.getMonthlyUsageReport);
router.get(
    "/ai-usage",
    eitherOr(authMiddleware, authSchoolAdminMiddleware, authTeacherMiddleware),
    reportController.getAiUsageSummary,
);

module.exports = router;
