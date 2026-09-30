const mongoose = require("mongoose");

const SkillTestAttemptSchema = new mongoose.Schema(
  {
    skillTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillTest",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOptionIndex: Number,
        isCorrect: Boolean,
      },
    ],

    score: Number,
    percentage: Number,

    status: {
      type: String,
      enum: ["in_progress", "submitted", "approved", "rejected"],
      default: "in_progress",
    },

    submissionData: {
      type: Object, // file URLs / answers / project metadata
      default: {},
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SkillTestAttempt",
  SkillTestAttemptSchema
);
