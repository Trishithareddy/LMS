const mongoose = require("mongoose");

const studentChapterProgress = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
        required: true
    },
    chapterUTS: {
        type: Number,
        default: 0
    },
    EbookUTS: {
        type: Number,
        default: 0
    },
    videoUTS:{
        type:Number,
        default:0
    }
}, { timestamps: true });


const StudentChapterProgress = mongoose.model('StudentChapterProgress', studentChapterProgress);

module.exports = StudentChapterProgress;

// delete the chapterprogress schema from database