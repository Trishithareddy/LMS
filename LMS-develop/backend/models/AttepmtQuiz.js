const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: { type: String, required: true }, // matches question.id

    selectedOption: { type: mongoose.Schema.Types.Mixed },

    questionType: { type: String },
    question: { type: String },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    maxMarks: { type: Number, default: 0 },
    awardedMarks: { type: Number, default: 0 },
    isCorrect: { type: Boolean },
    feedback: { type: String }
});

const quizAttemptSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },

    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

    answers: [answerSchema],

    score: { type: Number, default: 0 },

    isPassed: { type: Boolean, default: false },

    percentage: { type: Number, default: 0 },

    duration: { type: Number, default: 0 },

    submittedAt: { type: Date, default: Date.now },

    teacherReviewed: { type: Boolean, default: false },

    teacherReviewedAt: { type: Date, default: null },

    teacherReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null
    }

}, { timestamps: true });

const AttemptQuiz = mongoose.model('AttemptQuiz', quizAttemptSchema);

module.exports = AttemptQuiz;
