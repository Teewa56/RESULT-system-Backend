const {
    signIn,
    studentProfile,
    logout,
    registeredCourses,
    carryOverCourses,
    result,
    allResults,
    getGPA,
    generateToken
} = require('../controllers/studentController');
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/signIn', signIn);
router.post('/logout', authMiddleware, logout);
router.get('/profile/:studentId', authMiddleware, studentProfile);
router.get('/registeredCourses/studentId', authMiddleware, registeredCourses);
router.get('/carryOverCourses/:id', authMiddleware, carryOverCourses);
router.post('/result/:id', authMiddleware, result);
router.get('/results/:id', authMiddleware, allResults);
router.post('/gpa/:id', authMiddleware, getGPA);
router.post('/refresh_token', authMiddleware, generateToken)

module.exports = router;