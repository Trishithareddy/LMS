const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PracticeProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,

    terminalOptions: {
      type: [String],
      required: true,
    },
    selectedLanguage: {
      type: String,
      //default: "html"
    },

    codeContent: {
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
      python: { type: String, default: "" },
      scratch: {
        sb3Base64: { type: String, default: null }, // base64 only (no data: prefix)
        meta: { type: Schema.Types.Mixed, default: null }, // {name, size} etc.
      },
    },

    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    submittedAt: {
      type: Date,
    },

    airaEvaluation: {
      summary: { type: String, default: "" },
      feedback: { type: String, default: "" },
      conceptMatch: { type: String, default: "" },
      completionLevel: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      suggestedTeacherFeedback: { type: String, default: "" },
      evaluatedAt: { type: Date, default: null },
    },

    teacherReview: {
      feedback: { type: String, default: "" },
      status: {
        type: String,
        enum: ["not_reviewed", "reviewed", "needs_revision"],
        default: "not_reviewed",
      },
      reviewedAt: { type: Date, default: null },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
        default: null,
      },
    },
  },
  { timestamps: true }
);



const PracticeProject = mongoose.model("PracticeProject", PracticeProjectSchema);
module.exports = PracticeProject;
