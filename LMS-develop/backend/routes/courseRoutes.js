const express = require("express");
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCoursesPaginated,
    getCourseById,
    updateCourse,
    addExistingCourseToSubcategory,
    deleteCourse,
    duplicateCourse,
} = require("../controllers/courseController");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure you have this middleware
const upload = require("../middleware/multer");
const eitherOr = require("../middleware/eitherOr");
const authTeacherMiddleware = require("../middleware/authTeacherMiddleware");
const authStudentMiddleware = require("../middleware/authStudentMiddleware");

router.post(
    "/:subCategoryId/addcourse",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    upload.single("image"),
    createCourse
);
router.get("/getAllCourses", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getAllCourses);
router.get("/paginated", getCoursesPaginated);

router.get("/:courseId", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), getCourseById);
router.put(
    "/updateCourse/:id",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    upload.single("image"),
    updateCourse
);
router.post(
    "/:subCategoryId/addExistingCourse",
    eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware),
    addExistingCourseToSubcategory
);
router.delete("/deleteCourse/:id", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), deleteCourse);

// route for dublication of course
router.post("/duplicateCourse/:courseId", eitherOr(authMiddleware, authTeacherMiddleware, authStudentMiddleware), duplicateCourse)
module.exports = router;
