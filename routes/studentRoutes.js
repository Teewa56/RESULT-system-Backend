const {
    signIn,
    studentProfile,
    logout,
    carryOverCourses,
    result,
    allResults,
    getGPA,
    generateToken,
    getRegisteredCourses
} = require('../controllers/studentController');
const router = require('express').Router();

router.post('/signIn', signIn);
router.post('/logout',  logout);
router.get('/profile/:studentId',  studentProfile);
router.get('/profile/registered-courses/:studentId', getRegisteredCourses)
router.get('/carryOverCourses/:studentId',  carryOverCourses);
router.post('/result/:studentId',  result);
router.get('/results/:studentId',  allResults);
router.get('/gpa/:studentId',  getGPA);
router.post('/refresh_token',  generateToken)

module.exports = router;