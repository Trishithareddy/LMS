const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        studentName: {
            type: String,
            default: "",
        },

        className: {
            type: String,
            default: "",
        },

        section: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["present", "absent", "late"],
            default: "absent",
        },

        remarks: {
            type: String,
            default: "",
        },

        markedBy: {
            type: String,
            enum: ["system", "teacher"],
            default: "teacher",
        },

        autoMarked: {
            type: Boolean,
            default: false,
        },

        loginTime: {
            type: Date,
            default: null,
        },
    },
    { _id: false }
);

const attendanceSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
        },

        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        batchName: {
            type: String,
            default: "",
        },

        className: {
            type: String,
            default: "",
        },

        section: {
            type: String,
            default: "",
        },

        date: {
            type: String,
            required: true,
        },

        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSession",
            default: null,
        },

        records: {
            type: [attendanceRecordSchema],
            default: [],
        },

        summary: {
            total: {
                type: Number,
                default: 0,
            },
            present: {
                type: Number,
                default: 0,
            },
            absent: {
                type: Number,
                default: 0,
            },
            late: {
                type: Number,
                default: 0,
            },
        },
    },
    { timestamps: true }
);

attendanceSchema.index(
    { batchId: 1, className: 1, section: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);