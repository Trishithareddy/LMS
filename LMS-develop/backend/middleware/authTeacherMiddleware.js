const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function teacherAuth(req, res, next) {
  const token =
  req.headers.authorization?.split(' ')[1] ||
  req.query.token;
  if (!token) return next(new Error('No token'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id);
    if (!teacher) return next(new Error('Invalid token'));

    req.teacher = teacher;
    req.user = teacher;          // 👈 normalize
    req.userRole = 'teacher';    // 👈 normalize
    next();
  } catch (err) {
    next(err);
  }
};
