const {
    signIn,
    lecturerProfile,
    logout,
    coursesTaking,
    getCourseResults,
    getCourseTaking,
    editCourseResults,
    uploadCourseResults,
    generateToken,
    getRegisteredStudents
} = require('../controllers/lecturerController');
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/signIn', signIn);
router.post('/logout', authMiddleware,logout);
router.get('/profile/:lecturerId', authMiddleware, lecturerProfile);
router.get('/registered-students/:courseCode', authMiddleware, getRegisteredStudents)
router.get('/courses-taking/:lecturerId', authMiddleware,coursesTaking);
router.get('/course-taking/:courseCode', authMiddleware,getCourseTaking);
router.get('/results/:lecturerId', authMiddleware,getCourseResults);
router.put('/result/:lecturerId', authMiddleware,editCourseResults);
router.post('/result/:lecturerId', authMiddleware,uploadCourseResults);
router.post('/refresh_token', authMiddleware,generateToken)

module.exports = router;