const express = require("express");
const router = express.Router();

const {
  createSkillTest,
  getSkillTestByChapter,
  getSkillTestForAdmin,
  updateSkillTest,
  deleteSkillTest,
  addQuestionsToSkillTest,
  getSkillTestById,
  submitSkillTestAttempt,
  removeQuestionFromSkillTest,
} = require("../controllers/skillTestController");

const authStudent = require("../middleware/authStudentMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const authAny = require("../middleware/authAnyMiddleware");

// CREATE SKILL TEST
router.post("/", createSkillTest);

// ADD QUESTIONS
router.post("/add-questions", addQuestionsToSkillTest);


// ADMIN FETCH
router.get(
  "/admin/chapter/:chapterId",
  authMiddleware,
  requireAdmin,
  getSkillTestForAdmin
);

// STUDENT FETCH
router.get(
  "/chapter/:chapterId",
  authAny,
  getSkillTestByChapter
);


// UPDATE
router.put("/:id", updateSkillTest);

// DELETE
router.delete("/:id", deleteSkillTest);

// SUBMIT SKILL TEST (✅ THIS FIXES YOUR ISSUE)
router.post("/submit", authStudent, submitSkillTestAttempt);

// OPTIONAL / LEGACY
router.post("/attempt", authStudent, submitSkillTestAttempt);

// REMOVE QUESTION
router.delete(
  "/:skillTestId/question/:questionId",
  removeQuestionFromSkillTest
);

// GET BY ID (KEEP LAST)
router.get("/:id", getSkillTestById);

module.exports = router;
