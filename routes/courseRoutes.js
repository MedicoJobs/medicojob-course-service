const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { uploadCourseVideo } = require('../middleware/uploadMiddleware');

// Admin and hospital route to upload a course
router.post('/', uploadCourseVideo.single('video'), courseController.uploadCourse);

// Get all courses (authenticated users)
router.get('/', authMiddleware, courseController.getAllCourses);

// Get specific course
router.get('/:id', authMiddleware, courseController.getCourseById);

// Mark course as complete and generate certificate
router.post('/:id/complete', authMiddleware, courseController.completeCourse);

module.exports = router;
