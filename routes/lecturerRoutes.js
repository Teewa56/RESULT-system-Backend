const {
    signIn,
    lecturerProfile,
    logout,
    coursesTaking,
    getCourseResults,
    getCourseTaking,
    editCourseResults,
    uploadCourseResults,
    generateToken
} = require('../controllers/lecturerController');
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/signIn', signIn);
router.post('/logout', authMiddleware,logout);
router.get('/profile/:id', authMiddleware, lecturerProfile);
router.get('/courses-taking/:id', authMiddleware,coursesTaking);
router.get('/course-taking/:courseId', authMiddleware,getCourseTaking);
router.get('/results/:lecturerId/:courseId', authMiddleware,getCourseResults);
router.put('/result/:lecturerId/:studentId/:courseCode', authMiddleware,editCourseResults);
router.post('/result/:lecturerId', authMiddleware,uploadCourseResults);
router.post('/refresh_token', authMiddleware,generateToken)

module.exports = router;