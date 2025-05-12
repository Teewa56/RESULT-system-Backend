const Course = require('../models/courseModel');
const Lecturer = require('../models/lecturerModel');
const Student = require('../models/studentModel');
const Result = require('../models/resultModels');
const jwt = require('jsonwebtoken');
const coursesData = require('../courses.json');

const getAssignedCourses = (lecturerName) => {
    return Object.values(coursesData)
        .flatMap(levels => Object.values(levels))
        .flatMap(semesters => Object.values(semesters))
        .filter(course => course.lecturer === lecturerName);
};

const lecturerController = {
    signIn: async (req, res) => {
        const { data } = req.body;
        const {fullName, userId} = data;
        try {
            const lecturerIdRegex = /^[A-Za-z]{4}\/\d{4}$/;
            if (!lecturerIdRegex.test(userId)) {
                return res.status(400).json({ message: 'Invalid registration ID format' });
            }
            const lecturer = await Lecturer.findOne({ registrationId: userId });
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
            if(lecturer.fullName !== fullName) return res.status(400).json({message: 'Wrong name'})
            const access_token = lecturerController.createAccessToken({ id: lecturer._id });
            const refresh_token = lecturerController.createRefreshToken({ id: lecturer._id });

            res.cookie('refresh_token', refresh_token, {
                httpOnly: true,
                path: '/api/lecturer/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({ message: 'Successful Login', access_token, lecturer });
        } catch (error) {
            console.error('Error in signIn:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/refresh_token' });
            return res.json({ msg: "Logged out" });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    lecturerProfile: async (req, res) => {
        const { id } = req.params;
        try {
            const lecturer = await Lecturer.findById(id);
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

            return res.status(200).json({ message: 'Lecturer profile retrieved successfully', lecturer });
        } catch (error) {
            console.error('Error in lecturerProfile:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    coursesTaking: async (req, res) => {
        const { id } = req.params;
        try {
            const courses = await Course.find({ lecturer: id });
            if (!courses.length) return res.status(404).json({ message: 'No courses found for this lecturer' });

            return res.status(200).json({ message: 'Courses retrieved successfully', courses });
        } catch (error) {
            console.error('Error in coursesTaking:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseTaking: async (req, res) => {
        const { courseId } = req.params;
        try {
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ message: 'Course not found' });

            const students = await Student.find({ registeredCourses: courseId });
            return res.status(200).json({ message: 'Course and students retrieved successfully', course, students });
        } catch (error) {
            console.error('Error in getCourseTaking:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseResults: async (req, res) => {
        const { courseId, lecturerId } = req.params;
        try {
            const course = await Course.findById(courseId);
            const lecturer = await Lecturer.findById(lecturerId);
            if (!course) return res.status(404).json({ message: 'Course does not exist' });
            if (!lecturer) return res.status(404).json({ message: 'Lecturer does not exist' });

            if (!course.lecturer.equals(lecturer._id)) {
                return res.status(403).json({ message: 'Unauthorized access to course results' });
            }

            const results = await Result.find({ course: courseId }).populate('student');
            return res.status(200).json({ message: 'Course results retrieved successfully', course, results });
        } catch (error) {
            console.error('Error in getCourseResults:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    uploadCourseResults: async (req, res) => {
        const { lecturerId } = req.params;
        const { results } = req.body;
        try {
            const lecturer = await Lecturer.findById(lecturerId);
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

            const assignedCourses = getAssignedCourses(lecturer.fullName);
            if (!assignedCourses.length) return res.status(404).json({ message: 'No courses assigned to this lecturer' });

            for (const result of results) {
                const student = await Student.findById(result.studentId);
                if (!student) continue;

                const course = assignedCourses.find(c => c['Course-Code'] === result.courseCode);
                if (!course) continue;

                await Result.create({
                    student: result.studentId,
                    course: course._id,
                    testScore: result.testScore,
                    examScore: result.examScore,
                    gpa: result.gpa,
                    semester: student.currentSemester,
                    level: student.currentLevel,
                });
            }

            return res.status(200).json({ message: 'Results uploaded successfully' });
        } catch (error) {
            console.error('Error in uploadCourseResults:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    editCourseResults: async (req, res) => {
        const { lecturerId, studentId, courseCode } = req.params;
        const { data } = req.body;
        const {testScore, examScore} = data;
        try {
            const lecturer = await Lecturer.findById(lecturerId);
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: 'Student not found' });
            const assignedCourses = getAssignedCourses(lecturer.fullName);
            const course = assignedCourses.find(c => c['Course-Code'] === courseCode);
            if (!course) return res.status(404).json({ message: 'Course not found or not assigned to this lecturer' });
            const results = await Result.find({ student: studentId, course: course._id });
            if (!results) return res.status(404).json({ message: 'Result not found' });
            results.map((result) => {
                result.testScore = testScore;
                result.examScore = examScore;
            });
            await results.save();
            return res.status(200).json({ message: 'Result updated successfully' });
        } catch (error) {
            console.error('Error in editCourseResults:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    generateToken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if (!rf_token) return res.status(400).json({ message: "Please login now" });
            jwt.verify(rf_token, process.env.REFRESHTOKENSECRET, async (err, result) => {
                if (err) return res.status(400).json({ message: "Invalid token" });
                const user = await Lecturer.findById(result.id);
                if (!user) return res.status(400).json({ message: "User does not exist" });
                const access_token = createAccessToken({ id: user._id });
                res.json({
                    access_token,
                    user
                });
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    createAccessToken: (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    },

    createRefreshToken: (payload) => {
        return jwt.sign(payload, process.env.REFRESHTOKENSECRET, { expiresIn: '7d' });
    },
};

module.exports = lecturerController;