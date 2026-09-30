const mongoose = require("mongoose");

const StudentBadgeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },
    source: {
      type: String,
      enum: ["SKILL_TEST", "QUIZ", "PROJECT"],
      default: "SKILL_TEST",
    },
    percentage: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentBadge", StudentBadgeSchema);