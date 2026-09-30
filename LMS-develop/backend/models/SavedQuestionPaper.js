const mongoose = require("mongoose");

const paperQuestionSchema = new mongoose.Schema(
    {
        questionNumber: {
            type: Number,
        },
        sectionNumber: {
            type: Number,
            default: 1,
        },

        sectionTitle: {
            type: String,
            default: "",
        },

        sectionQuestionNumber: {
            type: Number,
            default: 1,
        },

        questionType: {
            type: String,
            default: "",
        },

        difficulty: {
            type: String,
            default: "",
        },
        skillType: {
            type: String,
            default: "Concept Check",
        },

        marks: {
            type: Number,
            default: 1,
        },

        question: {
            type: String,
            default: "",
        },

        questionStem: {
            type: String,
            default: "",
        },

        options: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },

        answer: {
            type: mongoose.Schema.Types.Mixed,
            default: "",
        },

        correctAnswer: {
            type: mongoose.Schema.Types.Mixed,
            default: "",
        },

        explanation: {
            type: String,
            default: "",
        },

        source: {
            type: String,
            default: "", // question_bank / aira / hybrid
        },

        sourceReference: {
            type: String,
            default: "",
        },
    },
    { _id: true },
);

const blueprintSchema = new mongoose.Schema(
    {
        questionNumber: {
            type: Number,
        },
        sectionNumber: {
            type: Number,
            default: 1,
        },

        sectionTitle: {
            type: String,
            default: "",
        },

        sectionQuestionNumber: {
            type: Number,
            default: 1,
        },

        skillType: {
            type: String,
            default: "Concept Check",
        },

        questionType: {
            type: String,
            required: true,
        },

        difficulty: {
            type: String,
            default: "Medium",
        },

        marks: {
            type: Number,
            default: 1,
        },
    },
    { _id: false },
);

const savedQuestionPaperSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        createdByRole: {
            type: String,
            default: "teacher",
        },

        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },

        courseName: {
            type: String,
            default: "",
        },

        chapterIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Chapter",
            },
        ],

        chapterNames: {
            type: [String],
            default: [],
        },

        sourceMode: {
            type: String,
            enum: ["question_bank", "aira", "hybrid"],
            default: "hybrid",
        },

        blueprint: {
            type: [blueprintSchema],
            default: [],
        },

        questions: {
            type: [paperQuestionSchema],
            default: [],
        },

        totalMarks: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["draft", "final"],
            default: "draft",
        },

        generationMeta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        generationFingerprint: {
            type: String,
            default: "",
            index: true,
        },
    },
    { timestamps: true },
);

savedQuestionPaperSchema.index(
    { createdBy: 1, generationFingerprint: 1 },
    {
        unique: true,
        partialFilterExpression: { generationFingerprint: { $gt: "" } },
    },
);

module.exports = mongoose.model("SavedQuestionPaper", savedQuestionPaperSchema);
