const jwt = require('jsonwebtoken');
const SchoolAdmin = require('../models/SchoolAdmin');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authSchoolAdminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new Error('No token')); // Pass error to next
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const schoolAdmin = await SchoolAdmin.findById(decoded.id);

    if (!schoolAdmin) {
      return next(new Error('Invalid token')); // Pass error to next
    }

    req.schoolAdmin = schoolAdmin;
    next(); // Success case
  } catch (error) {
    next(error); // Pass error to next
  }
};

module.exports = authSchoolAdminMiddleware;