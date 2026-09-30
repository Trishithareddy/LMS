const mongoose = require("mongoose");
require("dotenv").config();

const UserBadge = require("../models/UserBadge");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "lmsDB",
    });

    console.log("✅ Connected for cleanup");

    const result = await UserBadge.deleteMany({
      userRole: "teacher",
      note: /Auto-awarded/i, // matches "Auto-awarded", "Auto-awarded (TEST MODE)"
    });

    console.log(`🧹 Cleanup done. Deleted ${result.deletedCount} teacher badges`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
})();
