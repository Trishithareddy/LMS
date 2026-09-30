const mongoose = require("mongoose");

const criteriaScoreSchema = new mongoose.Schema(
    {
        criteria: {
            type: String,
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
        feedback: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const submissionVersionSchema = new mongoose.Schema(
    {
        textAnswer: { type: String, default: "" },
        codeAnswer: { type: String, default: "" },
        fileUrl: { type: String, default: "" },
        fileName: { type: String, default: "" },
        uploadedFileUrl: { type: String, default: "" },
        uploadedFileName: { type: String, default: "" },
        uploadedFileType: { type: String, default: "" },
        uploadedFileSize: { type: Number, default: 0 },
        projectLink: { type: String, default: "" },
        studentNote: { type: String, default: "" },
        submittedAt: { type: Date, default: null },
        status: { type: String, default: "" },
    },
    { _id: false }
);

const assignmentSubmissionSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },

        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        className: {
            type: String,
            default: "",
        },

        sectionName: {
            type: String,
            default: "",
        },

        classSection: {
            type: String,
            default: "",
            index: true,
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        studentName: {
            type: String,
            default: "",
        },

        textAnswer: {
            type: String,
            default: "",
        },

        codeAnswer: {
            type: String,
            default: "",
        },

        fileUrl: {
            type: String,
            default: "",
        },

        fileName: {
            type: String,
            default: "",
        },

        uploadedFileUrl: {
            type: String,
            default: "",
        },

        uploadedFileName: {
            type: String,
            default: "",
        },

        uploadedFileType: {
            type: String,
            default: "",
        },

        uploadedFileSize: {
            type: Number,
            default: 0,
        },

        projectLink: {
            type: String,
            default: "",
        },

        studentNote: {
            type: String,
            default: "",
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },

        resubmissionCount: {
            type: Number,
            default: 0,
        },

        submissionHistory: {
            type: [submissionVersionSchema],
            default: [],
        },

        isLate: {
            type: Boolean,
            default: false,
        },

        airaEvaluation: {
            suggestedMarks: {
                type: Number,
                default: null,
            },
            feedback: {
                type: String,
                default: "",
            },
            criteriaScores: {
                type: [criteriaScoreSchema],
                default: [],
            },
            strengths: {
                type: [String],
                default: [],
            },
            improvements: {
                type: [String],
                default: [],
            },
            evaluatedAt: {
                type: Date,
                default: null,
            },
        },

        finalMarks: {
            type: Number,
            default: null,
        },

        teacherComment: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "assigned",
                "submitted",
                "reviewed",
                "needs_correction",
                "late_submission",
            ],
            default: "submitted",
        },
    },
    { timestamps: true }
);

assignmentSubmissionSchema.index(
    { assignmentId: 1, studentId: 1 },
    { unique: true }
);

assignmentSubmissionSchema.index({
    batchId: 1,
    classSection: 1,
    submittedAt: -1,
});

module.exports = mongoose.model(
    "AssignmentSubmission",
    assignmentSubmissionSchema
);
