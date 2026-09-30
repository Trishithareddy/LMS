// backend/routes/authRoutes.js
const router = require("express").Router();
const adminAuth   = require("../middleware/authMiddleware");          // your strict admin middleware
// (optional) bring these if you later want /auth/me to work for all roles
let teacherAuth, studentAuth;
try { teacherAuth = require("../middleware/authTeacherMiddleware"); } catch {}
try { studentAuth = require("../middleware/authStudentMiddleware"); } catch {}

// Small helper: pick the first populated identity + role
function pickIdentity(req) {
  if (req.admin)   return { who: req.admin,   role: "admin" };
  if (req.teacher) return { who: req.teacher, role: "teacher" };
  if (req.student) return { who: req.student, role: "student" };
  return { who: null, role: null };
}


router.get("/auth/me", adminAuth, (req, res) => {
  const { who, role } = pickIdentity(req);
  if (!who) return res.status(401).json({ message: "Unauthorized" });

  
  const id    = who._id || who.id;
  const name  = who.name || who.fullName || who.username || "";
  const email = who.email || who.username || "";

  return res.json({
    user: { id, name, email, role: role || "admin" }
  });
});

module.exports = router;
