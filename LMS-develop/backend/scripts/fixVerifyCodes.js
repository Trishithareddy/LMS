const mongoose = require("mongoose");
const UserBadge = require("../models/UserBadge");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;
const DEFAULT_ACADEMIC_YEAR = "2025-2026";

async function run() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected");

    // 🔥 PROCESS BOTH STUDENTS & TEACHERS
    const roles = ["student", "teacher"];

    for (const role of roles) {
      const userIds = await UserBadge.distinct("userId", {
        userRole: role,
      });

      console.log(`👥 Found ${userIds.length} ${role}s`);

      for (const userId of userIds) {
        const badges = await UserBadge.find({
          userId,
          userRole: role,
        }).sort({ awardedAt: 1 });

        let verifyCode = 101;

        for (const badge of badges) {
          const update = {};

          // 🟢 Assign verifyCode if missing
          if (!badge.verifyCode) {
            update.verifyCode = verifyCode;
            verifyCode++;
          } else {
            verifyCode = Math.max(verifyCode, badge.verifyCode + 1);
          }

          // 🟢 Assign academicYear if missing
          if (!badge.academicYear) {
            update.academicYear = DEFAULT_ACADEMIC_YEAR;
          }

          if (Object.keys(update).length > 0) {
            await UserBadge.updateOne(
              { _id: badge._id },
              { $set: update },
              { runValidators: false } // 🔥 prevents academicYear validation crash
            );

            console.log(
              `✅ ${role} ${userId} → badge ${badge._id} →`,
              update
            );
          }
        }
      }
    }

    console.log("🎉 Migration completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

run();
