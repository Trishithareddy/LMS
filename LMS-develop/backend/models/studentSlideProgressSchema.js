const mongoose = require('mongoose');

const studentSlideProgress = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    lessonUTS: {
        type: Number,
        required: true,
        default: 0
    },
    slideProgress: [{
        slideIndex: {
            type: Number,
            required: true
        },
        timeSpent: {
            type: Number,  // Time in seconds or minutes
            default: 0
        },
    }]
}, {
    timestamps: true
});

studentSlideProgress.index({ studentId: 1, lessonId: 1 }, { unique: true });

// Compound index for faster queries
const StudentSlideProgress = mongoose.model('StudentSlideProgress', studentSlideProgress);

module.exports = StudentSlideProgress;