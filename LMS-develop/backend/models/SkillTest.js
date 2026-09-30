const mongoose = require("mongoose");

const SkillTestSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true,
    unique: true,
  },

  title: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },

  questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        //ref: "SkillTestQuestion",
        ref: "QuestionBase",
      },
    ],
  enabled: {
      type: Boolean,
      default: false,
    },

  passingPercentage: {
    type: Number,
    default: 60,
  },
}, { timestamps: true });

module.exports = mongoose.model("SkillTest", SkillTestSchema);
