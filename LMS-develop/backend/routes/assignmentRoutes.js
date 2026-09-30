const express = require("express");

const {
    createAssignment,
    getTeacherAssignments,
    getStudentAssignments,
    submitAssignment,
    getAssignmentSubmissions,
    runAiraEvaluation,
    reviewSubmission,
    getAllTeacherSubmissions,
    getAssignmentReport,
    updateAssignment,
    uploadSubmissionFile,
    uploadAssignmentAttachment,
} = require("../controllers/assignmentController");

const authMiddleware = require("../middleware/authMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const eitherOr = require("../middleware/eitherOr");
const upload = require("../middleware/multer");

const router = express.Router();

const allowTeacherOrAdmin = eitherOr(authMiddleware, authTeacherMiddleware);
const allowStudent = authStudentMiddleware;

router.post("/create", allowTeacherOrAdmin, createAssignment);
router.post(
    "/attachment-file",
    allowTeacherOrAdmin,
    upload.single("file"),
    uploadAssignmentAttachment,
);
router.put("/:assignmentId", allowTeacherOrAdmin, updateAssignment);

router.get("/teacher", allowTeacherOrAdmin, getTeacherAssignments);

router.get("/student", allowStudent, getStudentAssignments);

router.post("/submit", allowStudent, submitAssignment);
router.post(
    "/submission-file",
    allowStudent,
    upload.single("file"),
    uploadSubmissionFile,
);
router.get(
    "/teacher/submissions",
    allowTeacherOrAdmin,
    getAllTeacherSubmissions,
);

router.get(
    "/:assignmentId/submissions",
    allowTeacherOrAdmin,
    getAssignmentSubmissions,
);

router.post(
    "/submission/:submissionId/aira-evaluate",
    allowTeacherOrAdmin,
    runAiraEvaluation,
);

router.patch(
    "/submission/:submissionId/review",
    allowTeacherOrAdmin,
    reviewSubmission,
);

router.get("/report/summary", allowTeacherOrAdmin, getAssignmentReport);

module.exports = router;
