/**
 * Backfill teacher badges based on student badges
 * Rules:
 * - Only PRIMARY teachers get badges
 * - Badge must be derivedFrom student badge
 * - Idempotent (no duplicates)
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

/* ================= MODELS ================= */
const UserBadge = require("../models/UserBadge");
const Badge = require("../models/Badge");
const Batch = require("../models/Batch");

/* ================= HELPERS ================= */
const getAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const getNextVerifyCode = async () => {
  const last = await UserBadge.findOne().sort({ verifyCode: -1 }).lean();
  return (last?.verifyCode || 1000) + 1;
};

/* ================= MAIN ================= */
async function backfillTeacherBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
  dbName: "lmsDB",
})
    console.log("✅ Connected for teacher badge backfill");

    // 1️⃣ Fetch all student badges
    const studentBadges = await UserBadge.find({
      userRole: "student",
    }).lean();

    console.log(`🎓 Student badges found: ${studentBadges.length}`);

    let awarded = 0;

    for (const sb of studentBadges) {
      const {
        userId: studentId,
        badgeId: studentBadgeId,
        courseId,
        chapterId,
      } = sb;

      // 2️⃣ Find teacher badge derived from this student badge
      const teacherBadge = await Badge.findOne({
        audience: "TEACHER",
        "criteria.derivedFromBadge": studentBadgeId,
        "criteria.courseId": courseId,
        "criteria.chapterId": chapterId,
      }).lean();

      if (!teacherBadge) continue;

      // 3️⃣ Find batch where student exists
      const batch = await Batch.findOne({
        students: studentId,
      }).lean();

      if (!batch || !batch.teachers?.length) continue;

      // 4️⃣ Find PRIMARY teacher only
      const primaryTeacher = batch.teachers.find(
        (t) => t.role === "PRIMARY"
      );

      if (!primaryTeacher) continue;

      const teacherId = primaryTeacher.teacher;

      // 5️⃣ Idempotency check
      const exists = await UserBadge.findOne({
        userId: teacherId,
        userRole: "teacher",
        badgeId: teacherBadge._id,
        courseId,
        chapterId,
      });

      if (exists) continue;

      // 6️⃣ Award badge
      await UserBadge.create({
        userId: teacherId,
        userRole: "teacher",
        badgeId: teacherBadge._id,
        courseId,
        chapterId,
        academicYear: getAcademicYear(),
        note: "Auto-awarded via backfill (PRIMARY teacher)",
        verifyCode: await getNextVerifyCode(),
        awardedAt: new Date(),
      });

      awarded++;
      console.log(
        `🏅 Awarded ${teacherBadge.title} → Teacher ${teacherId}`
      );
    }

    console.log(`🎉 Backfill complete. Teacher badges awarded: ${awarded}`);
  } catch (err) {
    console.error("❌ Backfill failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

/* ================= RUN ================= */
backfillTeacherBadges();
