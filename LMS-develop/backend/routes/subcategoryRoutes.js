const express = require('express');
const router = express.Router();
const {createSubcategory,getAllSubcategories,addExistingSubcategoryToCategory,getSubcategoryById,updateSubcategory,deleteSubcategory,
    getAllchaptersBySubCategoryId,getAllCoursesBySubCategoryId
    
} = require('../controllers/subcategoryController');
const authStudentMiddleware = require('../middleware/authStudentMiddleware'); // Import the student auth middleware
const authMiddleware = require('../middleware/authMiddleware');
const eitherOr = require('../middleware/eitherOr');
const authTeacherMiddleware = require('../middleware/authTeacherMiddleware');

// POST /api/categories/:categoryId/subcategories - Create a new subcategory
router.post('/:categoryId/subcategories',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), createSubcategory);
router.get('/getAllSubcategories',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getAllSubcategories);
router.post('/:categoryId/add-subcategory',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), addExistingSubcategoryToCategory);
router.get('/:subCategoryId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getSubcategoryById);
router.put('/updateSubcategory/:id',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),updateSubcategory);
router.delete('/deleteSubcategory/:subCategoryId', eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware), deleteSubcategory);
router.get('/chapters/:subCategoryId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getAllchaptersBySubCategoryId);
router.get('/courses/:subCategoryId',eitherOr(authMiddleware,authTeacherMiddleware,authStudentMiddleware),getAllCoursesBySubCategoryId);



module.exports = router;
