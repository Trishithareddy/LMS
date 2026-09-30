const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["MCQ", "Fill In the Blanks", "True or False", "Very Short Answer"],
            required: true,
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium",
        },

        questionNumber: {
            type: Number,
        },

        question: {
            type: String,
            required: true,
            trim: true,
        },

        options: {
            type: [String],
            default: [],
        },

        correctAnswer: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        acceptableAnswers: {
            type: [String],
            default: [],
        },

        gradingKeywords: {
            type: [String],
            default: [],
        },

        gradingHint: {
            type: String,
            default: "",
        },

        marks: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },

        source: {
            type: String,
            default: "",
        },
    },
    { _id: true }
);

const chapterQuizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        totalMarks: {
            type: Number,
            required: true,
            min: 1,
        },

        timeLimit: {
            type: Number,
            default: 30,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        allowReattempt: {
            type: Boolean,
            default: true,
        },

        showCorrectAnswers: {
            type: Boolean,
            default: true,
        },

        passingPercentage: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },

        questions: {
            type: [questionSchema],
            validate: {
                validator: function (questions) {
                    return Array.isArray(questions) && questions.length > 0;
                },
                message: "Quiz must have at least one question.",
            },
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },

        assignedChapter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
        },

        assignedChapters: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Chapter",
            },
        ],

        chapterNames: {
            type: [String],
            default: [],
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChapterwiseQuiz", chapterQuizSchema);
