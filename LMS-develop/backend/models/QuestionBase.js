const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const Schema = mongoose.Schema;

// this is schema is responsible for Question Generator  & Creations

const questionBaseSchema = new Schema(
    {
        questionId: {
            type: Number,
            unique: true,
        },
        questionType: {
            type: String,
            required: true,
            trim: true,
            enum: [
                "MCQ",
                "Short Answer",
                "Fill In the Blanks",
                "Long Answer",
                "Very Short Answer",
                "True or False",
            ],
        },
        questionTitle: {
            type: String,
            required: true,
            trim: true,
        },
        grade: {
            type: Schema.Types.ObjectId,
            ref: "Grade",
            required: false,
            trim: true,
        },
        gradeName: {
            type: String,
            required: false,
            trim: true,
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: false,
            trim: true,
        },
        courseName: {
            type: String,
            required: false,
            trim: true,
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            trim: true,
        },
        chapterName: {
            type: String,
            required: false,
            trim: true,
        },
        difficultyLevel: {
            type: String,
            required: true,
            trim: true,
        },
        skillType: {
            type: String,
            default: "Concept Check",
            trim: true,
        },
        source: {
            type: String,
            enum: ["manual", "aira", "imported", "question_bank", "hybrid"],
            default: "manual",
        },
        normalizedQuestion: {
            type: String,
            default: "",
            index: true,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        lastUsedAt: {
            type: Date,
            default: null,
        },
        teacherApprovedCount: {
            type: Number,
            default: 0,
        },
        generatedBySchools: [
            {
                type: Schema.Types.ObjectId,
                ref: "School",
            },
        ],
        generatedByUsers: [
            {
                type: Schema.Types.ObjectId,
            },
        ],
        questionStem: {
            type: String, // Storing as raw HTML
            required: true,
            trim: true,
        },
        explanation: {
            type: String, // Storing as raw HTML
            required: true,
            trim: true,
        },
    },
    { discriminatorKey: "questionType", timestamps: true },
);

questionBaseSchema.plugin(AutoIncrement, { inc_field: "questionId" });
questionBaseSchema.index({
    chapter: 1,
    questionType: 1,
    difficultyLevel: 1,
    skillType: 1,
    normalizedQuestion: 1,
});

// Create base model
const QuestionBase = mongoose.model("QuestionBase", questionBaseSchema);

// MCQ specific schema
const mcqSchema = new Schema({
    options: [
        {
            type: Schema.Types.ObjectId,
            ref: "Options",
            required: true,
        },
    ],
    answer: {
        type: String,
        required: true,
    },
});

// Short answer one word schema
const veryShortAnswerSchema = new Schema({
    answer: {
        type: String,
        required: true,
    },
    answerVariations: [
        {
            type: String,
        },
    ],
});

// True/False schema
const trueFalseSchema = new Schema({
    answer: {
        type: Boolean,
        required: true,
    },
});

// Other types schema (Short Answers, Fill in the blanks, Long answers)
const simpleAnswerSchema = new Schema({
    answer: {
        type: String,
        required: true,
    },
});

// Create discriminator models
const MCQQuestion = QuestionBase.discriminator("MCQ", mcqSchema);
const VeryShortAnswerQuestion = QuestionBase.discriminator(
    "Very Short Answer",
    veryShortAnswerSchema,
);
const TrueFalseQuestion = QuestionBase.discriminator(
    "True or False",
    trueFalseSchema,
);
const ShortAnswerQuestion = QuestionBase.discriminator(
    "Short Answer",
    simpleAnswerSchema,
);
const FillBlanksQuestion = QuestionBase.discriminator(
    "Fill In the Blanks",
    simpleAnswerSchema,
);
const LongAnswerQuestion = QuestionBase.discriminator(
    "Long Answer",
    simpleAnswerSchema,
);

module.exports = {
    QuestionBase,
    MCQQuestion,
    VeryShortAnswerQuestion,
    TrueFalseQuestion,
    ShortAnswerQuestion,
    FillBlanksQuestion,
    LongAnswerQuestion,
};
