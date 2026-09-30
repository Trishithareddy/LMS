const mongoose = require("mongoose");
const crypto = require("crypto");

const UserBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    userRole: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },

    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    },

    academicYear: {
      type: String, // e.g. "2024-2025"
      required: true,
    },

    badgeNumber: {
      type: String,
      unique: true,
      index: true,
    },

    verifyCode: {
      type: Number,
      index: true,
    },
    note: String,

    awardedAt: {
      type: Date,
      default: Date.now,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* 🔐 AUTO BADGE NUMBER */
UserBadgeSchema.pre("save", function (next) {
  if (!this.badgeNumber) {
    this.badgeNumber =
      "ST-BDG-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

module.exports = mongoose.model("UserBadge", UserBadgeSchema);
