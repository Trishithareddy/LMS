const mongoose = require("mongoose");

const skillTestQuestionSchema = new mongoose.Schema(
  {
    skillTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SkillTest",
      required: true,
    },

    questionText: { type: String, required: true },

    options: [
      {
        text: String,
      },
    ],

    correctOptionIndex: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SkillTestQuestion",
  skillTestQuestionSchema
);
