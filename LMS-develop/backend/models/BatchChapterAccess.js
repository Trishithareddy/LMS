const mongoose = require("mongoose");

const batchChapterAccessSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
            index: true,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
            index: true,
        },
        chapterEnabled: {
            type: Boolean,
            default: false,
        },
        ebookEnabled: {
            type: Boolean,
            default: true,
        },
        videoEnabled: {
            type: Boolean,
            default: true,
        },
        resourcesEnabled: {
            type: Boolean,
            default: true,
        },
        practiceEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

batchChapterAccessSchema.index(
    { batchId: 1, courseId: 1, chapterId: 1 },
    { unique: true }
);

module.exports = mongoose.model("BatchChapterAccess", batchChapterAccessSchema);
