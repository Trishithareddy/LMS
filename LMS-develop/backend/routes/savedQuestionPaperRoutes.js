const express = require("express");

const {
    saveQuestionPaper,
    getMyQuestionPapers,
    getQuestionPaperById,
    updateQuestionPaper,
    deleteQuestionPaper,
} = require("../controllers/savedQuestionPaperController");

const authMiddleware = require("../middleware/authMiddleware");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");
const eitherOr = require("../middleware/eitherOr");

const router = express.Router();

const allowLoggedInUsers = eitherOr(
    authMiddleware,
    authTeacherMiddleware,
    authStudentMiddleware
);

router.post("/save", allowLoggedInUsers, saveQuestionPaper);

router.get("/my-papers", allowLoggedInUsers, getMyQuestionPapers);

router.get("/:id", allowLoggedInUsers, getQuestionPaperById);

router.put("/:id", allowLoggedInUsers, updateQuestionPaper);

router.delete("/:id", allowLoggedInUsers, deleteQuestionPaper);

module.exports = router;