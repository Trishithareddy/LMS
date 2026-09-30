const express = require("express");
const {
    lessonTimespend,
    updateEbookTime,
    getStudentCourseProgress,
    getStudentReleasedCourseProgress,
    updateVideoTime,
    getVideoTimeSpent
} = require("../controllers/lessonController")
const router = express.Router();
const authStudentMiddleware = require("../middleware/authStudentMiddleware"); 
const authMiddleware = require("../middleware/authMiddleware");
const eitherOr = require("../middleware/eitherOr");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");


router.post("/lessonprogress", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), lessonTimespend);

router.post("/ebookprogress", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), updateEbookTime);

router.get("/student-courses/:studentId/:courseId", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getStudentCourseProgress);

router.get("/student-courses/:studentId/:courseId/released", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getStudentReleasedCourseProgress);

router.post("/videoprogress", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),updateVideoTime)


router.get("/getvideoprogress/:studentId/:videoIndex/:chapterId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getVideoTimeSpent)

module.exports = router;
