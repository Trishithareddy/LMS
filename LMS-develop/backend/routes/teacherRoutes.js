const express = require('express');
const { updateStudentDetails,viewStudent,getStudentInsights,getBatchId,loginTeacher,getTeacherInfo,getBatchInfo,
    updateCoursePublishedStatus,getStudentsFromTeacherBatches ,getStudentsByTeacherId, getTeacherBatches,getBatchBasicInfo, createAnnouncement,getTeacherOverview,getTeacherAnnouncements,updateAnnouncement,deleteAnnouncement,repostAnnouncement
 } = require('../controllers/teacherController');
const eitherOr = require('../middleware/eitherOr');
const authMiddleware = require('../middleware/authMiddleware');
const authStudentMiddleware = require('../middleware/authStudentMiddleware'); // Import the student auth middleware
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware'); 
//const teacherAuth = require('../middleware/authTeacherMiddleware')(true); // strict

const router = express.Router();

router.post('/login', loginTeacher);
router.get('/getLoggedinTeacher',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getTeacherInfo);
router.get("/getBatchBasicInfo/:id", authTeacherMiddleware, getBatchBasicInfo);
router.get('/getBatchInfo/:batchId1',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getBatchInfo);
router.put('/updateCoursePublished/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), updateCoursePublishedStatus);
router.get('/getAllStudentsfromBatches',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getStudentsFromTeacherBatches);
router.get('/getBatchId/:batchId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getBatchId);
router.get('/viewStudent/:studentId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),viewStudent);
router.get('/studentInsights/:studentId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getStudentInsights);
router.get('/get/allBatches',authTeacherMiddleware,getTeacherBatches);
router.post('/create/announcement',authTeacherMiddleware,createAnnouncement);
router.put('/announcement/:id', authTeacherMiddleware, updateAnnouncement);
router.delete('/announcement/:id', authTeacherMiddleware, deleteAnnouncement);
router.post('/announcement/:id/repost', authTeacherMiddleware, repostAnnouncement);
router.get('/overview', authTeacherMiddleware, getTeacherOverview);
router.get(
  '/all/announcements',
  eitherOr(authMiddleware, authTeacherMiddleware),
  getTeacherAnnouncements
);
router.get(
  "/announcements",
  authTeacherMiddleware,
  getTeacherAnnouncements
);


//test rlute 
router.get('/test',authTeacherMiddleware,getStudentsByTeacherId);
router.put('/updateStudent/:studentId',authTeacherMiddleware,updateStudentDetails);


module.exports = router;
