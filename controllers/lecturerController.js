const Lecturer = require('../models/lecturerModel');
const Student = require('../models/studentModel');
const Result = require('../models/resultModels');
const jwt = require('jsonwebtoken');
const coursesData = require('../courses.json');


const lecturerController = {
    signIn: async (req, res) => {
        const { data } = req.body;
        const {fullName, userId} = data;
        try {
            const lecturerIdRegex = /^[A-Za-z]{4}\/\d{4}$/;
            if (!lecturerIdRegex.test(userId)) return res.status(400).json({ message: 'Invalid registration ID format' });
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
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    coursesTaking: async (req, res) => {
        const { lecturerId } = req.params;
        try {
            const lecturer = await Lecturer.findById(lecturerId);
            const courses = lecturer.coursesTaking;
            if (!courses.length) return res.status(404).json({ message: 'No courses found for this lecturer' });
            return res.status(200).json({ message: 'Courses retrieved successfully', courses });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseTaking: async (req, res) => {
        const { courseCode } = req.params;
        try {
            const course = coursesData[department]?.[level]?.[semester][courseCode]
            return res.status(200).json({ message: 'Course retrieved successfully', course });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },
    
    getRegisteredStudents: async (req, res) => {
        const {courseCode} = req.params;
        try {
            const students = await Student.find();
            const resgisteredStudents = students.filter(student => {
                student.registeredCourses.includes(courseCode);
            }).map(student => student)
            return res.status(200).json({message: 'Students', resgisteredStudents })
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseResults: async (req, res) => {
        const { lecturerId } = req.params;
        const { courseCode } = req.body;
        try {
            const result = await Result.find({courseCode: courseCode, lecturer: lecturerId})
            return res.status(200).json({ message: 'Course results retrieved successfully', course, result });
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
            const assignedCourses = lecturer.coursesTaking;
            for (const result of results) {
                const student = await Student.findById(result.studentId);
                if (!student) continue;
                const course = assignedCourses.find(c => c === result.courseCode);
                if (!course) continue;
                await Result.create({
                    student: result.studentId,
                    course: course,
                    testScore: result.testScore,
                    examScore: result.examScore,
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
        const { lecturerId } = req.params;
        const { data } = req.body;
        try {
            const result = await Result.findOneAndUpdate(
                {
                    courseCode: data.courseCode, 
                    lecturer: lecturerId, 
                    student: data.studentId
                },
                {
                    testScore: data.testScore,
                    examScore: data.examScore
                },
                { new: true }
            );
            
            if (!result) {
                return res.status(404).json({ message: 'Result not found' });
            }
            
            return res.status(200).json({ 
                message: 'Result updated successfully',
                result 
            });
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