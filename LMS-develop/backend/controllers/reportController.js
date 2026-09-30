const UserActivity = require("../models/UserActivity");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const AiApiUsage = require("../models/AiApiUsage");

exports.getMonthlyUsageReport = async (req, res) => {
  try {
    const { schoolId, year } = req.query;

    const report = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);

      const activeStudents = await UserActivity.distinct("userId", {
        userType: "STUDENT",
        school: schoolId,
        createdAt: { $gte: startDate, $lt: endDate },
      });

      const totalStudents = await Student.countDocuments({ school: schoolId });

      const activeTeachers = await UserActivity.distinct("userId", {
        userType: "TEACHER",
        school: schoolId,
        createdAt: { $gte: startDate, $lt: endDate },
      });

      const totalTeachers = await Teacher.countDocuments({ school: schoolId });

      report.push({
        month: month + 1,
        studentsUsed: activeStudents.length,
        totalStudents,
        teachersUsed: activeTeachers.length,
        totalTeachers,
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Error generating report" });
  }
};

exports.getAiUsageSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = req.query.start
      ? new Date(req.query.start)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = req.query.end ? new Date(req.query.end) : now;
    const requestedSchool = req.query.schoolId;
    const actorSchool = req.schoolAdmin?.school || req.teacher?.school || null;
    const match = { createdAt: { $gte: start, $lte: end } };

    if (actorSchool) {
      match.school = actorSchool;
    } else if (requestedSchool) {
      match.school = requestedSchool;
    }

    const [byFeature, bySchool, totals] = await Promise.all([
      AiApiUsage.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$feature",
            calls: { $sum: "$messageCount" },
            successful: { $sum: { $cond: ["$success", 1, 0] } },
            failed: { $sum: { $cond: ["$success", 0, 1] } },
            averageDurationMs: { $avg: "$durationMs" },
          },
        },
        { $sort: { calls: -1 } },
      ]),
      AiApiUsage.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$school",
            calls: { $sum: "$messageCount" },
            successful: { $sum: { $cond: ["$success", 1, 0] } },
            failed: { $sum: { $cond: ["$success", 0, 1] } },
          },
        },
        { $sort: { calls: -1 } },
      ]),
      AiApiUsage.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            calls: { $sum: "$messageCount" },
            successful: { $sum: { $cond: ["$success", 1, 0] } },
            failed: { $sum: { $cond: ["$success", 0, 1] } },
          },
        },
      ]),
    ]);

    const monthlyLimit = Number(process.env.CHATPDF_MONTHLY_MESSAGE_LIMIT || 12000);
    const usedCalls = Number(totals[0]?.calls || 0);
    const isSchoolScoped = Boolean(actorSchool);
    const usagePercent = !isSchoolScoped && monthlyLimit
      ? Math.round((usedCalls / monthlyLimit) * 10000) / 100
      : null;
    const alertLevel =
      usagePercent !== null && usagePercent >= 95
        ? "critical"
        : usagePercent !== null && usagePercent >= 85
          ? "high"
          : usagePercent !== null && usagePercent >= 70
            ? "warning"
            : "normal";

    res.json({
      success: true,
      period: { start, end },
      totals: totals[0] || { calls: 0, successful: 0, failed: 0 },
      plan: {
        scope: isSchoolScoped ? "school" : "platform",
        monthlyLimit,
        usedCalls,
        remainingCalls: isSchoolScoped ? null : Math.max(0, monthlyLimit - usedCalls),
        usagePercent,
        alertLevel,
      },
      byFeature,
      bySchool,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating AI usage report",
      error: error.message,
    });
  }
};
