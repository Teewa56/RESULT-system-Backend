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

router.post('/signIn', signIn);
router.post('/logout', logout);
router.get('/profile/:id',  lecturerProfile);
router.get('/registered-students/:courseCode',  getRegisteredStudents)
router.get('/courses-taking/:lecturerId', coursesTaking);
router.get('/course-taking/:courseCode', getCourseTaking);
router.get('/results/:lecturerId', getCourseResults);
router.put('/result/:lecturerId', editCourseResults);
router.post('/result/:lecturerId', uploadCourseResults);
router.post('/refresh_token', generateToken)

module.exports = router;