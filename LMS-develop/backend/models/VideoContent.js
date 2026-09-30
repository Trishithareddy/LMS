const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const videoContentSchema = new Schema(
    {
        videoTitle: {
            type: String,
            required: true,
        },
        videoUrl: {
            type: String,
            required: true,
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
        },
        expectedTime: {
            type: Number,
            required: true,
            default: 0
        }
    },
    { timestamps: true }
);
const VideoContent = mongoose.model("VideoContent", videoContentSchema);
module.exports = VideoContent;
