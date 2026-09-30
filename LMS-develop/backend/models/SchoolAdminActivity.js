const mongoose = require("mongoose");

const schoolAdminActivitySchema = new mongoose.Schema(
    {
        schoolAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolAdmin",
            required: true,
        },
        school: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        targetType: {
            type: String,
            enum: ["student", "teacher", "batch", "school", "system"],
            default: "system",
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        targetName: {
            type: String,
            default: "",
        },
        details: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SchoolAdminActivity", schoolAdminActivitySchema);
