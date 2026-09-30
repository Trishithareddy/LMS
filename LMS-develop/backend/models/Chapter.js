const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const chapterSchema = new Schema({
    chapterId: {
        type: Number,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },

    subCategory: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: false
    },
    subCategoryName: {
        type: String,
        required: false
    },
    subCategoryDescription: {
        type: String
    },

    concepts: [{
        type: Schema.Types.ObjectId,
        ref: 'Concept'
    }],

    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: false,
    },
    courseName: {
        type: String,
        required: false,
    },
    courseDescription: {
        type: String,
    },
    lessons: [
        {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
        },
    ],

    Ebook: {
        type: String,
        required: false,
    },
    EbookExpectedtime: {
        type: Number,
        default: 0
    },
    pdfText: {
        type: String,
    },

    worksheet: {
        type: String,
        default: null,

    },

    videoLessons: [
        {
            type: Schema.Types.ObjectId,
            ref: "VideoContent",
        },
    ],
    terminalEnabled: {
        type: Boolean,
        default: false,
    },

    terminalOptions: {
        type: [String],
        enum: ["html", "python", "javascript", "scratch"],
        default: null,
    },
    links: [
        {
            title: { type: String, required: true },
            instruction: { type: String, required: true },
            link: { type: String, required: true },
        },
    ],
    linksEnabled: {
        type: Boolean,
        default: false,
    },
    chapterExpectedtime: {
        type: Number,
        default: 0
    },
    videoExpectedtime: {
        type: Number,
        default: 0
    },
    labActivity: {
        type: Schema.Types.ObjectId,
        ref: "LabActivity",
        required: false
    },

    qbChapterId: {
        type: Schema.Types.ObjectId,
        ref: "Chapter",
        required: false
    },
    instructionsText: {
        type: String, default: ""
    },

    skillTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SkillTest",
        default: null,
    },

    skillTestEnabled: {
        type: Boolean,
        default: false,
    },

    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Badge",
    },
    ChapterQuiz :{
        type: mongoose.Schema.Types.ObjectId,
        ref:"ChapterwiseQuiz"
    }


});

chapterSchema.plugin(AutoIncrement, { inc_field: 'chapterId' });

const Chapter = mongoose.model("Chapter", chapterSchema);

module.exports = Chapter;
