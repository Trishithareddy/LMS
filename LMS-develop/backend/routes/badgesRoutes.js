const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const badgeController = require("../controllers/badgeController");

// 🔐 AUTH MIDDLEWARES
const authAdmin = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const authStudent = require("../middleware/authStudentMiddleware");
const authTeacher = require("../middleware/authTeacherMiddleware");

/* ---------- MULTER SETUP ---------- */
const uploadDir = path.join(__dirname, "..", "public", "badges");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e4)}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({ storage });

/* ======================================================
   ⚠️ IMPORTANT: ORDER MATTERS – DO NOT CHANGE
   ====================================================== */
router.get("/verify", badgeController.verifyBadgePublic);


router.get(
  "/download/:badgeNumber",
  badgeController.downloadBadge
);

router.get("/share/badge/:verifyCode", badgeController.shareBadgePreview);

/* ---------- STUDENT BADGES ---------- */
router.get(
  "/user-badges/me",
  authStudent,
  badgeController.getMyBadges
);

/* ---------- TEACHER BADGES ---------- */
router.get(
  "/teacher-badges/me",
  authTeacher,
  badgeController.getTeacherBadges
);

// 👨‍🏫 TEACHER: STUDENTS WITH BADGES
router.get(
  "/teacher/students-with-badges",
  authTeacher,
  badgeController.getStudentsWithBadges
);

router.patch(
  "/teacher-badges/:id/archive",
  authTeacher,
  badgeController.archiveTeacherBadge
);

router.get(
  "/teacher-badges/archived",
  authTeacher,
  badgeController.getArchivedTeacherBadges
);

router.patch(
  "/teacher-badges/:id/restore",
  authTeacher,
  badgeController.restoreTeacherBadge
);


/* ---------- ADMIN BADGES ---------- */
router.post(
  "/upload-icon",
  authAdmin,
  requireAdmin,
  upload.single("icon"),
  badgeController.uploadIcon
);

router.post(
  "/",
  authAdmin,
  requireAdmin,
  badgeController.createBadge
);

router.get(
  "/",
  authAdmin,
  requireAdmin,
  badgeController.getBadges
);

router.post(
  "/course-badges",
  authAdmin,
  requireAdmin,
  badgeController.assignBadgeToCourse
);

router.post(
  "/user-badges/award",
  authAdmin,
  requireAdmin,
  badgeController.awardBadgeToUsers
);

/* ---------- ADMIN (ID BASED) ---------- */
router.get(
  "/:id",
  authAdmin,
  requireAdmin,
  badgeController.getBadgeById
);

router.put(
  "/:id",
  authAdmin,
  requireAdmin,
  badgeController.updateBadge
);

router.delete(
  "/:id",
  authAdmin,
  requireAdmin,
  badgeController.deleteBadge
);



module.exports = router;
