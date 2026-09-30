const mongoose = require("mongoose");

const aiApiUsageSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            default: "chatpdf",
            index: true,
        },
        feature: {
            type: String,
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        userRole: {
            type: String,
            default: "unknown",
        },
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            default: null,
            index: true,
        },
        sourceId: {
            type: String,
            default: "",
        },
        success: {
            type: Boolean,
            default: true,
            index: true,
        },
        messageCount: {
            type: Number,
            default: 1,
        },
        durationMs: {
            type: Number,
            default: 0,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        error: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

aiApiUsageSchema.index({ createdAt: -1, feature: 1 });
aiApiUsageSchema.index({ school: 1, createdAt: -1 });

module.exports = mongoose.model("AiApiUsage", aiApiUsageSchema);
