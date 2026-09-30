const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, index: true },
  description: { type: String },
  iconUrl: { type: String },
  templateUrl: {
  type: String,
  required: true
},

  // 🔥 WHO CAN RECEIVE THIS BADGE
  audience: {
    type: String,
    enum: ["STUDENT", "TEACHER"],
    required: true,
  },

  // 🔥 HOW IT IS EARNED
  criteria: {
    type: {
      type: String,
      enum: ["SKILL_TEST", "COURSE", "MANUAL","DERIVED"],
      required: true,
    },

    // used only for SKILL_TEST
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    },

    minPercentage: {
      type: Number, // e.g. 80
    },

    // used for COURSE completion
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    // Teacher badge is derived from which student badge
    derivedFromBadge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
    },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);
