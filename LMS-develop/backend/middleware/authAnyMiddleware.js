const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

module.exports = async function authAny(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Try Admin first
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      req.user = admin;
      req.userRole = "ADMIN";
      return next();
    }

    // 🔹 Try Student
    const student = await Student.findById(decoded.id);
    if (student) {
      req.user = student;
      req.userRole = "STUDENT";
      return next();
    }

    return res.status(401).json({ message: "Invalid token user" });
  } catch (err) {
    console.error("AuthAny error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
