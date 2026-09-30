// routes/category.routes.js
const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, getCategoryById, updateCategory,deleteCategory,getSubCategoriesByCategoryId,
    fetchAllCategoriesForQuestionBase
 } = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure you have this middleware
const eitherOr = require('../middleware/eitherOr');
const authStudentMiddleware = require('../middleware/authStudentMiddleware');
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');


router.post('/addCategory',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), createCategory);
router.get('/getAllCategories',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getAllCategories);
router.get('/getCategory/:id',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getCategoryById);
router.put('/updateCategory/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), updateCategory);
router.delete('/deleteCategory/:id', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteCategory);
router.get('/getSubCategories/:id',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), getSubCategoriesByCategoryId);
router.get('/fetch/allCategories',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),fetchAllCategoriesForQuestionBase);

module.exports = router;
