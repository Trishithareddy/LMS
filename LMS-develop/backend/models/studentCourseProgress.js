const mongoose = require("mongoose");

const studentCourseProgress = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    courseUTS: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


const StudentCourseProgress = mongoose.model('StudentCourseProgress', studentCourseProgress);

module.exports = StudentCourseProgress;

// delete the chapterprogress schema from database
