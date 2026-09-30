const express = require("express");
const router = express.Router();
const {
    createVideo,
    getVideo,
    updateVideo,
    deleteVideo,
    getAllVideosByChapterId,
} = require("../controllers/videoContent");
const eitherOr = require('../middleware/eitherOr');
const authMiddleware = require('../middleware/authMiddleware');
const authStudentMiddleware = require('../middleware/authStudentMiddleware'); // Import the student auth middleware
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');
// Route to create a video
router.post("/:chapterId", eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),createVideo);

// Route to get a video by id
router.get("/:videoId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getVideo);

// Route to update a video
router.put("/:videoId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), updateVideo);

// Route to delete a video by id
router.delete("/:videoId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteVideo);

// Route to fetch all videos in a chapter
router.get("/chapter/:chapterId",eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getAllVideosByChapterId);

module.exports = router;
