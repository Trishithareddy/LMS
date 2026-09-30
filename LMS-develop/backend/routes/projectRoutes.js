const express = require("express");
const {
    createOrUpdateProject,
    getTeacherProjects,
    getProject,
    getProjectsByStudent,
    getProjectByStudentAndChapter,
    getProjectByTeacher,
} = require("../controllers/projectController");
const projectCtrl = require("../controllers/projectController");
const router = express.Router();
const authStudentMiddleware = require("../middleware/authStudentMiddleware"); // Import the student auth middleware
const authMiddleware = require("../middleware/authMiddleware");
const eitherOr = require("../middleware/eitherOr");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const { getMyPracticeProjects, getPracticeProjectById, updatePracticeProject, createPracticeProject, deletePracticeProject, getSubmittedProjectsForTeacher, submitPracticeProject, runAiraProjectEvaluation, saveTeacherProjectReview, } = require("../controllers/PracticeProjectController");

// IMPORTANT: raw body ONLY for this route
router.put(
  "/:id.sb3",
  express.raw({ type: "application/octet-stream", limit: "200mb" }),
  projectCtrl.putSb3
);

router.get("/:id.sb3", projectCtrl.getSb3);

router.post(
    "/createOrUpdateProject",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    createOrUpdateProject
);
router.get("/getAllProjects", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getTeacherProjects); // not used yet
router.get(
    "/student",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getProjectsByStudent
);
router.get(
    "/teacher/:batchId/:courseId/:chapterId",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getProjectByTeacher
);
router.get(
    "/:studentId/:chapterId",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    getProjectByStudentAndChapter
);
// router.get("/:id",getProject);
router.post('/create-practice-project', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), createPracticeProject);
router.get('/get-practice-project', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getMyPracticeProjects);
router.get('/get-practice-project/:id', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getPracticeProjectById);
router.put('/update-practice-project/:id', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), updatePracticeProject);
router.post('/submit-practice-project/:id',eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), submitPracticeProject);
router.get('/get-submitted-practice-project',eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),getSubmittedProjectsForTeacher);
router.post('/practice-project/:id/aira-evaluate', eitherOr(authMiddleware, authTeacherMiddleware), runAiraProjectEvaluation);
router.patch('/practice-project/:id/teacher-review', eitherOr(authMiddleware, authTeacherMiddleware), saveTeacherProjectReview);
router.delete('/delete-practice-project/:id', eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deletePracticeProject);


module.exports = router;
