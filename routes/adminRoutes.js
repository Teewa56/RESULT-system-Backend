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
    getCurrentSemester,
    updateStudentSemesterLevel,
    generateToken
} = require('../controllers/adminController');
const router = require('express').Router();

// Authentication and profile routes
router.post('/signIn', signIn);
router.get('/profile/:adminId',  adminProfile);
router.post('/logout', logout);

// Edit routes
router.put('/editLecturer/:id',  editLecturerInfo);
router.put('/editAdmin/:id',  editAdminProfile);
router.put('/editStudent/:id',  editStudentInfo);

// Creation routes
router.post('/newAdmin',  newAdmin);
router.post('/newLecturer',  newLecturer);
router.post('/newStudent',  newStudent);

// Retrieval routes
router.get('/allAdmins',  allAdmins);
router.get('/allStudents',  allStudents);
router.get('/allLecturers',  allLecturers);
router.get('/searchLecturer/:search',  searchLecturer);
router.get('/searchStudent/:search',  searchStudent);
router.get('/studentProfile/:id',  studentProfile);
router.get('/lecturerProfile/:id',  lecturerProfile);

// Result and course management routes
router.post('/resultPreview', resultPreview);
router.post('/releaseResult',  releaseResult);
router.post('/closeResultSubmission',  closeResultSubmission);
router.get('/getCourseInfo',  getCourseInfo);
router.get('/currentSemester', getCurrentSemester);

// Semester and course registration routes
router.post('/registerCourses',  registerCoursesForSemester);
router.post('/updateStudentSemesterLevel',  updateStudentSemesterLevel);
router.post('/refresh_token',  generateToken)

module.exports = router;