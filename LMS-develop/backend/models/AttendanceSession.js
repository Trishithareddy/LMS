const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
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

        startTime: {
            type: Date,
            default: Date.now,
        },

        endTime: {
            type: Date,
            required: true,
        },

        durationMinutes: {
            type: Number,
            default: 45,
        },

        graceMinutes: {
            type: Number,
            default: 10,
        },

        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
        },

        closedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

attendanceSessionSchema.index({
    batchId: 1,
    className: 1,
    section: 1,
    date: 1,
    status: 1,
});

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);