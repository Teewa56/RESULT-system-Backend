const {
    signIn,
    adminProfile,
    editLecturerInfo,
    editAdminProfile,
    editStudentInfo,
    newAdmin,
    newLecturer,
    newStudent,
    logout,
    allAdmins,
    allStudents,
    allLecturers,
    searchLecturer,
    searchStudent,
    resultPreview,
    releaseResult,
    closeResultSubmission,
    getCourseInfo,
    studentProfile,
    lecturerProfile,
    registerCoursesForSemester,
    updateStudentSemesterLevel,
    generateToken
} = require('../controllers/adminController');
const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleWare');

// Authentication and profile routes
router.post('/signIn', signIn);
router.get('/profile/:id', authMiddleware, adminProfile);
router.post('/logout', authMiddleware,logout);

// Edit routes
router.put('/editLecturer/:id', authMiddleware, editLecturerInfo);
router.put('/editAdmin/:id', authMiddleware, editAdminProfile);
router.put('/editStudent/:id', authMiddleware, editStudentInfo);

// Creation routes
router.post('/newAdmin', authMiddleware ,newAdmin);
router.post('/newLecturer', authMiddleware, newLecturer);
router.post('/newStudent', authMiddleware, newStudent);

// Retrieval routes
router.get('/allAdmins', authMiddleware, allAdmins);
router.get('/allStudents', authMiddleware, allStudents);
router.get('/allLecturers', authMiddleware, allLecturers);
router.get('/searchLecturer/:search', authMiddleware, searchLecturer);
router.get('/searchStudent/:search', authMiddleware, searchStudent);
router.get('/studentProfile/:id', authMiddleware, studentProfile);
router.get('/lecturerProfile/:id', authMiddleware, lecturerProfile);

// Result and course management routes
router.get('/resultPreview', authMiddleware, resultPreview);
router.post('/releaseResult', authMiddleware, releaseResult);
router.post('/closeResultSubmission', authMiddleware, closeResultSubmission);
router.get('/getCourseInfo/:courseId', authMiddleware, getCourseInfo);

// Semester and course registration routes
router.post('/registerCourses', authMiddleware, registerCoursesForSemester);
router.post('/updateStudentSemesterLevel', authMiddleware, updateStudentSemesterLevel);
router.post('/refresh_token', authMiddleware, generateToken)

module.exports = router;