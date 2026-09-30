const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LabActivitySchema = new mongoose.Schema(
    {
        chapterId: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
        },
        pdfs: [
            {
                name: { 
                    type: String, 
                    required: true 
                },
                pdfId: { 
                    type: String, 
                    required: true, 
                },
                pdfText:{
                    type: String,
                    required: false
                }
            },
        ],
    },
    { timestamps: true }
);

const LabActivity = mongoose.model("LabActivity", LabActivitySchema);

module.exports = LabActivity;
