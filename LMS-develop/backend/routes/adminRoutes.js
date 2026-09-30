// routes/admin.js

const express = require('express');
const {
  createAdmin, login, createSchool,deleteSchool,updateSchool, createProgramManager, assignSchoolsToProgramManager,
  getAllProgramManagers, updateProgramManager, deleteProgramManager, createSchoolAdmin,
  createStudent, createTeacher, updateStudent, getAllSchools, updateTeacher, getStudentById, getTeacherById, createBatch,updateBatch,deleteBatch, assignStudentsAndTeachersToBatch,
  assignCoursesToBatchAndStudents,changePrimaryTeacher, getAllBatches, createQuiz, assignQuizToBatches, deleteQuizFromBatches, deassignStudentsAndTeachersFromBatch, deassignCoursesFromBatchAndStudents,
  getAllStudents, getAllTeachers, getStudentGroups, getTeacherGroups,
  getSchoolById,
  getBatchById,
  getAllSchoolAdmin, deleteMultipleStudents, deleteMultipleTeachers,
  getChapterLessons,
  getChapterVideos,
  getLessonSlides,
  getBatchCourses,
  getCourseChapters,
  updateEbookExpectedTime,
  updateTimeInterval,
  getTimeInterval,
  getAllBatchesWithFillterAndPagination,
  updateAdminData,
  getAdminOverview,
  getSchoolUsageReport,
  createBatchValidators
} = require('../controllers/adminController');


const { createSchoolAdmins, getAllSchoolAdmins, updateSchoolAdmin, deleteSchoolAdmin, addBatchToSchoolAdmin, getSchoolAdminInfo, loginSchoolAdmin } = require("../controllers/schoolAdminController")

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Ensure you have this middleware
const upload = require("../middleware/multer");
const eitherOr = require('../middleware/eitherOr');
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');
const authStudentMiddleware = require('../middleware/authStudentMiddleware');
const authSchoolAdminMiddleware = require("../middleware/authSchoolAdminMiddleware")

router.patch(
  '/batch/:batchId/change-primary',
  eitherOr(authMiddleware, authSchoolAdminMiddleware),
  changePrimaryTeacher
);

router.post('/create', createAdmin);
router.post('/login', login);
router.get('/overview', authMiddleware, getAdminOverview);
router.get('/school-usage-report', authMiddleware, getSchoolUsageReport);
router.post("/update",authMiddleware,updateAdminData)
router.post('/createSchool', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), upload.single("image"), createSchool);
router.put(
  "/school/update/:schoolId",
  eitherOr(authMiddleware, authSchoolAdminMiddleware),
  upload.single("image"), // only if you support image update
  updateSchool
);
router.get('/getSchoolByid/:schoolId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getSchoolById)
router.get('/getAllSchoolAdmins', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllSchoolAdmin)
router.delete(
  "/school/delete/:schoolId",
  eitherOr(authMiddleware, authSchoolAdminMiddleware),
  deleteSchool
);

router.post('/student/create', eitherOr(authMiddleware,authSchoolAdminMiddleware), createStudent);
router.post('/teacher/create', eitherOr(authMiddleware,authSchoolAdminMiddleware), createTeacher);
router.put('/student/update/:studentId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware,authSchoolAdminMiddleware), updateStudent);
router.get('/getAllSchools', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware,authSchoolAdminMiddleware),getAllSchools);
router.put('/teacher/update/:teacherId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware,authSchoolAdminMiddleware), updateTeacher);
router.get('/student/:studentId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getStudentById);
router.get('/teacher/:teacherId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getTeacherById);
router.post('/delete-multiple-students', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deleteMultipleStudents);
router.post('/delete-multiple-teachers', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deleteMultipleTeachers);




router.get('/getAllStudents', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllStudents);
router.get('/student-groups', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getStudentGroups);
router.get('/getAllTeachers', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllTeachers);
router.get('/teacher-groups', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getTeacherGroups);



router.post('/batch/create', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), upload.single("image"), createBatch);
router.get('/batchbyId/:batchId', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getBatchById);
router.put(
  "/batch/update/:batchId",
  eitherOr(authMiddleware, authSchoolAdminMiddleware),upload.single("image"),updateBatch);
router.delete(
  "/batch/delete/:batchId",
  eitherOr(authMiddleware, authSchoolAdminMiddleware),
  deleteBatch
);
router.post('/batch/assign', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware, authSchoolAdminMiddleware), assignStudentsAndTeachersToBatch);
router.post('/batch/assign-courses', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), assignCoursesToBatchAndStudents);
router.post('/batch/deassign-courses', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deassignCoursesFromBatchAndStudents);
router.post('/batch/deassign', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware, authSchoolAdminMiddleware), deassignStudentsAndTeachersFromBatch);
router.get('/getAllBatches', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllBatches);

// filter batches
router.get('/get-All-Batches', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllBatchesWithFillterAndPagination)

//manage progress routes
router.get('/getAllLessonsFromAChapter/:chapterId', getChapterLessons);
router.get('/getAllVideosFromAChapter/:chapterId', getChapterVideos);
router.get('/getLessonSlides/:lessonId', getLessonSlides);
router.get('/getCoursesForABatch/:batchId', getBatchCourses);
router.get('/getChaptersForACourse/:courseId', getCourseChapters)
router.put('/updateChapterEbookTime', updateEbookExpectedTime)


//time management for student side routes
router.put('/updateTimeInterval', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), updateTimeInterval)
router.get('/getTimeInterval', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getTimeInterval)



module.exports = router;
  
