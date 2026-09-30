const mongoose = require("mongoose");

const videoProgressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VideoContent",
        required: true
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
        required: true
    },
    timeSpent: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Adding a compound index for efficient querying
videoProgressSchema.index({ studentId: 1, videoId: 1, chapterId: 1 });

const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);

module.exports = VideoProgress;