// routes/student.js
const express = require('express');
const { login,getLoggedInStudent,getStudentAnnouncements,markAnnouncementRead,getStudentAttendanceSummary
 } = require('../controllers/studentController');
const authStudentMiddleware = require('../middleware/authStudentMiddleware'); // Import the student auth middleware
const authMiddleware = require('../middleware/authMiddleware');
const eitherOr = require('../middleware/eitherOr');
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');
const router = express.Router();

router.post('/login', login);
router.get('/profile',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),  getLoggedInStudent);
router.get('/all/announcements',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getStudentAnnouncements)
router.post(
  '/announcement/read/:id',
  authStudentMiddleware,
  markAnnouncementRead
);
router.get(
  '/attendance/summary',
  authStudentMiddleware,
  getStudentAttendanceSummary
);
module.exports = router;
