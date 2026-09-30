const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lessonSchema = new mongoose.Schema(
    {
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
        },
        lessonName: {
            type: String,
            required: true
        },
        lessonExpectedtime: {
            type: Number,         
            default: 0
        },
        slides: [
            {
                content: {
                    type: String, // Slide content stored as raw HTML
                    required: false
                },
                speakerNotes: {
                    type: String,
                    default: "",
                },
                slideType: {
                    type: String, // Slide content stored as raw HTML
                    required: false
                },
                expectedTime: {           // Add this field
                    type: Number,         // Time in seconds or minutes
                    default: 0
                },
                selectedQuestion: {
                    type: Schema.Types.ObjectId,
                    ref: 'QuestionBase'
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Lesson", lessonSchema);
