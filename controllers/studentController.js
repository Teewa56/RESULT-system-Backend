const Student = require('../models/studentModel');
const Result = require('../models/resultModels');
const jwt = require('jsonwebtoken');
const coursesData = require('../courses.json');

const studentController = {
    signIn: async (req, res) => {
        const { data } = req.body;
        const {fullName, userId} = data
        try {
            const matricNumberRegex = /^[A-Za-z]{3}\/\d{2}\/\d{4}$/;
            if (!matricNumberRegex.test(userId)) {
                return res.status(400).json({ message: "Invalid matric number format" });
            }

            const student = await Student.findOne({ matricNo: userId });
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.fullName !== fullName) return res.status(401).json({ message: "Invalid credentials" });

            const access_token = studentController.createAccessToken({ id: student._id });
            const refresh_token = studentController.createRefreshToken({ id: student._id });

            res.cookie('refresh_token', refresh_token, {
                httpOnly: true,
                path: '/api/student/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({ message: "Sign in successful", access_token, student });
        } catch (error) {
            console.error('Error in signIn:', error.message);
            return res.status(500).json({ message: "Internal server error" });
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

    studentProfile: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });

            return res.status(200).json({ message: "Student profile retrieved successfully", student });
        } catch (error) {
            console.error('Error in studentProfile:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    registeredCourses: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });

            const { department, currentLevel, currentSemester } = student;
            const courses = coursesData[department]?.[currentLevel]?.[currentSemester] || [];

            return res.status(200).json({ message: "Registered courses retrieved successfully", courses });
        } catch (error) {
            console.error('Error in registeredCourses:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    carryOverCourses: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id).populate('carryOverCourses');
            if (!student) return res.status(404).json({ message: "Student not found" });

            return res.status(200).json({ message: "Carry over courses retrieved successfully", courses: student.carryOverCourses });
        } catch (error) {
            console.error('Error in carryOverCourses:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    result: async (req, res) => {
        const { id } = req.params;
        const { data } = req.body;
        const {level, semester} = data;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });
    
            const results = await Result.find({ student: id, level, semester, released: true}).populate('course');
            if (!results.length) return res.status(404).json({ message: "No results found for this semester" });
    
            const carryOverCourses = results
                .filter(result => {
                    const totalScore = result.testScore + result.examScore;
                    return totalScore < 45; 
                })
                .map(result => result.course._id);
    
            student.carryOverCourses = [...new Set([...student.carryOverCourses, ...carryOverCourses])];
            await student.save();
    
            return res.status(200).json({ 
                message: "Result retrieved successfully and carryover courses updated", 
                results, 
                carryOverCourses: student.carryOverCourses 
            });
        } catch (error) {
            console.error('Error in result:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    allResults: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });

            const results = await Result.find({ student: id }).populate('course');
            if (!results.length) return res.status(404).json({ message: "No results found" });

            return res.status(200).json({ message: "All results retrieved successfully", results });
        } catch (error) {
            console.error('Error in allResults:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getGPA: async (req, res) => {
        const { id } = req.params;
        const { data } = req.body;
        const {semester, level} = data;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });

            const results = await Result.find({ student: id, semester, level }).populate('course');
            if (!results.length) return res.status(404).json({ message: "No results found for this semester" });

            let totalWeightedPoints = 0;
            let totalUnits = 0;

            results.forEach(result => {
                const { testScore, examScore, course } = result;
                const totalScore = testScore + examScore;
                let gradePoint;

                if (totalScore >= 70) gradePoint = 5; // A
                else if (totalScore >= 60) gradePoint = 4; // B
                else if (totalScore >= 50) gradePoint = 3; // C
                else if (totalScore >= 45) gradePoint = 2; // D
                else if (totalScore >= 40) gradePoint = 1; // E
                else gradePoint = 0; // F

                totalWeightedPoints += gradePoint * course.courseUnits;
                totalUnits += course.courseUnits;
            });

            const gpa = (totalWeightedPoints / totalUnits).toFixed(2);
            student.cgpa = ((student.cgpa * student.levelsCompleted) + parseFloat(gpa)) / (student.levelsCompleted + 1);
            student.levelsCompleted += 1;
            await student.save();

            return res.status(200).json({ message: "GPA calculated successfully", gpa, cgpa: student.cgpa });
        } catch (error) {
            console.error('Error in getGPA:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    generateToken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if (!rf_token) return res.status(400).json({ message: "Please login now" });
            jwt.verify(rf_token, process.env.REFRESHTOKENSECRET, async (err, result) => {
                if (err) return res.status(400).json({ message: "Invalid token" });
                const user = await Student.findById(result.id);
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

module.exports = studentController;