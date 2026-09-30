const mongoose = require("mongoose");
require("dotenv").config();

const Batch = require("../models/Batch");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to DB");

    const batches = await Batch.find({});

    for (const batch of batches) {
      let modified = false;

      batch.teachers = batch.teachers.map(t => {
        if (mongoose.Types.ObjectId.isValid(t)) {
          modified = true;
          return {
            teacher: t,
            role: "SECONDARY"
          };
        }
        return t;
      });

      if (modified) {
        await batch.save();
        console.log(`✔ Updated batch: ${batch.batchName}`);
      }
    }

    console.log("🎉 Migration completed");
    process.exit();
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
}

migrate();