const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function studentAuth(req, res, next) {
  const token =
  req.headers.authorization?.split(' ')[1] ||
  req.query.token;
  if (!token) return next(new Error('No token'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findById(decoded.id);
    if (!student) return next(new Error('Invalid token'));
    if (!student.isActive) {
      return res.status(403).json({ success:false, message:'User is blocked by school Administrator' });
    }

    req.student = student;
    req.user = student;          
    req.userRole = 'student';    
    next();
  } catch (err) {
    next(err);
  }
};
