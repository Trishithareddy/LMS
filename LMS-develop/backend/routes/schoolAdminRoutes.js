const express = require('express');
const { createSchoolAdmins, getAllSchoolAdmins, updateSchoolAdmin, deleteSchoolAdmin, getSchoolAdminInfo, getSchoolAdminAnalytics, getSchoolAdminActivityLog, resetUserPassword, updateSchoolSettings, getDataQualityChecks, transferStudent, getStudentTransfers, createSchoolNotice, archiveBatch, loginSchoolAdmin, blockStudent, blockTeacher, deleteStudent, deleteTeacher } = require("../controllers/schoolAdminController")

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure you have this middleware
const eitherOr = require('../middleware/eitherOr');
const authSchoolAdminMiddleware= require("../middleware/authSchoolAdminMiddleware");
const { updateStudent, updateTeacher } = require('../controllers/adminController');


// school admin routes
router.post("/login", loginSchoolAdmin),
router.post('/create-school-admin', eitherOr(authMiddleware), createSchoolAdmins)
router.get('/getall-school-admin', eitherOr(authMiddleware), getAllSchoolAdmins)
router.put('/update-school-admin/:id', eitherOr(authMiddleware, authSchoolAdminMiddleware), updateSchoolAdmin)
router.delete('/delete-school-admin/:id', eitherOr(authMiddleware), deleteSchoolAdmin)
router.get('/get-logged-school-admin', eitherOr(authMiddleware, authSchoolAdminMiddleware), getSchoolAdminInfo)
router.get('/analytics', eitherOr(authMiddleware, authSchoolAdminMiddleware), getSchoolAdminAnalytics)
router.get('/activity-log', eitherOr(authMiddleware, authSchoolAdminMiddleware), getSchoolAdminActivityLog)
router.post('/reset-password', eitherOr(authMiddleware, authSchoolAdminMiddleware), resetUserPassword)
router.put('/settings', eitherOr(authMiddleware, authSchoolAdminMiddleware), updateSchoolSettings)
router.get('/data-quality', eitherOr(authMiddleware, authSchoolAdminMiddleware), getDataQualityChecks)
router.post('/transfer-student', eitherOr(authMiddleware, authSchoolAdminMiddleware), transferStudent)
router.get('/student-transfers', eitherOr(authMiddleware, authSchoolAdminMiddleware), getStudentTransfers)
router.post('/school-notice', eitherOr(authMiddleware, authSchoolAdminMiddleware), createSchoolNotice)
router.put('/batch/:batchId/archive', eitherOr(authMiddleware, authSchoolAdminMiddleware), archiveBatch)
router.put('/student/update/:id', eitherOr(authMiddleware,authSchoolAdminMiddleware), updateStudent);
router.put('/teacher/update/:id', eitherOr(authMiddleware, authSchoolAdminMiddleware), updateTeacher);
router.put('/block-student/:id', eitherOr(authMiddleware, authSchoolAdminMiddleware), blockStudent);
router.put('/block-teacher/:id', eitherOr(authMiddleware, authSchoolAdminMiddleware), blockTeacher);
router.delete("/delete-student/:id",eitherOr(authMiddleware, authSchoolAdminMiddleware), deleteStudent);
router.delete("/delete-teacher/:id",eitherOr(authMiddleware, authSchoolAdminMiddleware), deleteTeacher);


module.exports = router;
  
