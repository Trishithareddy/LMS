const mongoose = require('mongoose');


const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "MCQ",
      "Very Short Answer",
      "Fill In the Blanks",
      "True or False"
    ],
    required: true
  },
  question: { type: String, required: true,trim:true },
  options: [{ type: String }],
  correctAnswer: {
    type: mongoose.Schema.Types.String,
    required: true,
    trim: true
  },
  marks: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String },
  quizMode: {
    type: String,
    enum: ["formal", "fun", "revision"],
    default: "formal",
  },
  gameSettings: {
    pointsEnabled: { type: Boolean, default: false },
    streaksEnabled: { type: Boolean, default: false },
    instantFeedback: { type: Boolean, default: false },
    leaderboardEnabled: { type: Boolean, default: false },
  },
  totalMarks: { type: Number, required: true },
  timeLimit: { type: Number }, // in minutes
  status: {
    type: String,
    enum: ["draft", "scheduled", "active", "closed", "archived", "inactive"],
    default: "draft",
  },
  startDate: { type: Date },
  endDate: { type: Date },
  allowReattempt: { type: Boolean, default: false },
  showCorrectAnswers: { type: Boolean, default: false },
  passingPercentage: { type: Number, required: true },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true }, 
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }], 
  chapterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
  chapterNames: [{ type: String }],
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
