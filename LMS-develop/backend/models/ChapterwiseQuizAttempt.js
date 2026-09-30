const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        questionType: {
            type: String,
            default: "",
        },

        question: {
            type: String,
            default: "",
        },

        selectedOption: {
            type: mongoose.Schema.Types.Mixed,
            default: "",
        },

        correctAnswer: {
            type: mongoose.Schema.Types.Mixed,
            default: "",
        },

        maxMarks: {
            type: Number,
            default: 0,
        },

        awardedMarks: {
            type: Number,
            default: 0,
        },

        isCorrect: {
            type: Boolean,
            default: false,
        },

        feedback: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const chapterQuizAttemptSchema = new mongoose.Schema(
    {
        ChapterquizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChapterwiseQuiz",
            required: true,
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        answers: {
            type: [answerSchema],
            default: [],
        },

        score: {
            type: Number,
            default: 0,
        },

        percentage: {
            type: Number,
            default: 0,
        },

        isPassed: {
            type: Boolean,
            default: false,
        },

        duration: {
            type: Number,
            default: 0,
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChapterwiseQuizAttempt", chapterQuizAttemptSchema);