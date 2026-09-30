const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      answeredCount: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      updatedAt: Date,
    },
  },
  { _id: false },
);

const liveQuizSessionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "live", "ended"],
      default: "waiting",
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true },
);

const LiveQuizSession = mongoose.model("LiveQuizSession", liveQuizSessionSchema);

module.exports = LiveQuizSession;
