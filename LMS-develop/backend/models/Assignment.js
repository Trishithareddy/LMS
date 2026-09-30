const mongoose = require("mongoose");

const rubricSchema = new mongoose.Schema(
    {
        criteria: {
            type: String,
            required: true,
            trim: true,
        },
        marks: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const assignmentSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
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

        sectionName: {
            type: String,
            default: "",
        },

        classSection: {
            type: String,
            default: "",
            index: true,
        },

        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        courseName: {
            type: String,
            default: "",
        },

        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        chapterName: {
            type: String,
            default: "",
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        taskType: {
            type: String,
            enum: [
                "Quick Task",
                "Written Task",
                "Coding Task",
                "Practical Task",
                "Project Task",
            ],
            default: "Written Task",
        },

        description: {
            type: String,
            default: "",
        },

        assignmentType: {
            type: String,
            enum: [
                "Theory Assignment",
                "Coding Assignment",
                "Software Practical",
                "Project Work",
                "Worksheet Submission",
                "Quiz/Short Response",
                "File Upload Task",
                "Quick Task",
                "Written Task",
                "Practical Task",
                "Project Task",
            ],
            default: "Theory Assignment",
        },

        softwareTool: {
            type: String,
            enum: [
                "General",
                "Python",
                "Scratch",
                "HTML/CSS",
                "JavaScript",
                "MS Word",
                "MS PowerPoint",
                "MS Excel",
                "Canva / Design",
                "Robotics / Arduino",
                "AI / Teachable Machine",
                "Cyber Safety",
            ],
            default: "General",
        },

        submissionType: {
            type: String,
            enum: [
                "Text Answer",
                "Code Answer",
                "File URL",
                "Project Link",
                "File Upload",
                "Mixed Submission",
            ],
            default: "Mixed Submission",
        },

        // Dynamic assignment-specific settings
        expectedAnswerLength: {
            type: String,
            default: "",
        },

        problemStatement: {
            type: String,
            default: "",
        },

        starterCode: {
            type: String,
            default: "",
        },

        expectedOutput: {
            type: String,
            default: "",
        },

        testCases: {
            type: String,
            default: "",
        },

        practicalSteps: {
            type: String,
            default: "",
        },

        projectRequirements: {
            type: String,
            default: "",
        },

        worksheetUrl: {
            type: String,
            default: "",
        },

        allowedFileTypes: {
            type: String,
            default: "",
        },

        fileNameInstruction: {
            type: String,
            default: "",
        },

        dueDate: {
            type: String,
            required: true,
        },

        maxMarks: {
            type: Number,
            default: 10,
        },

        autoEvaluate: {
            type: Boolean,
            default: false,
        },

        rubric: {
            type: [rubricSchema],
            default: [],
        },

        attachmentUrl: {
            type: String,
            default: "",
        },

        attachmentName: {
            type: String,
            default: "",
        },

        attachmentType: {
            type: String,
            default: "",
        },

        attachmentSize: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["draft", "active", "closed"],
            default: "active",
        },
    },
    { timestamps: true }
);

assignmentSchema.index({
    teacherId: 1,
    batchId: 1,
    classSection: 1,
    createdAt: -1,
});

module.exports = mongoose.model("Assignment", assignmentSchema);
