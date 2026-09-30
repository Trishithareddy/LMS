const mongoose = require("mongoose");

const studentTransferSchema = new mongoose.Schema(
    {
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
        },
        schoolAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolAdmin",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        fromBatches: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
        }],
        toBatch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            default: null,
        },
        fromClass: { type: String, default: "" },
        toClass: { type: String, default: "" },
        fromSection: { type: String, default: "" },
        toSection: { type: String, default: "" },
        reason: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("StudentTransfer", studentTransferSchema);
