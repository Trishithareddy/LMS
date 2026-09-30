const mongoose = require("mongoose");

const teacherLessonProgressSchema = new mongoose.Schema(
    {
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

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        chapter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
        },

        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
        },

        status: {
            type: String,
            enum: ["not-started", "in-progress", "completed"],
            default: "not-started",
        },

        completedAt: {
            type: Date,
            default: null,
        },

        remarks: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

teacherLessonProgressSchema.index(
    {
        teacher: 1,
        batch: 1,
        course: 1,
        chapter: 1,
        lesson: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "TeacherLessonProgress",
    teacherLessonProgressSchema
);