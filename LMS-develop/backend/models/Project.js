const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ScratchSubSchema = new Schema(
  {
    sb3Base64: { type: String, default: null }, // base64 of .sb3
    meta: { type: Schema.Types.Mixed, default: null } // optional metadata
  },
  { _id: false }
);

const projectSchema = new Schema(
    {
        projectId: {
            type: Number,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        terminalOptions: {
            type: [String],
            required: true,
        },
        selectedLanguage: {
            type: String,
            //default: "html"
        },
        codeContent: {
            html: {
                type: String,
                default: "",
            },
            css: {
                type: String,
                default: "",
            },
            js: {
                type: String,
                default: "",
            },
            python: {
                type: String,
                default: "",
            },
            scratch: {
                 type: ScratchSubSchema,
                 default: null
            }
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            default: null,
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

projectSchema.plugin(AutoIncrement, { inc_field: "projectId" });
const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
