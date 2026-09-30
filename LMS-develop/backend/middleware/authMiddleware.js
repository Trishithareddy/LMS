const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new Error('No token')); // Pass error to next
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return next(new Error('Invalid token')); // Pass error to next
    }

    req.admin = admin;
    next(); // Success case
  } catch (error) {
    next(error); // Pass error to next
  }
};

module.exports = authMiddleware;