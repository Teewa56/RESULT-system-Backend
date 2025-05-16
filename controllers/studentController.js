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
            if (!matricNumberRegex.test(userId)) return res.status(400).json({ message: "Invalid matric number format" });
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
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getRegisteredStudents: async (req, res) => {
        const {courseCode} = req.params;
        try {
            const students = await Student.find({
                registeredCourses: { $in: [courseCode] }
            });
            return res.status(200).json({
                message: 'Students retrieved successfully', 
                registeredStudents: students 
            });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    carryOverCourses: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id).populate('carryOverCourses');
            if (!student) return res.status(404).json({ message: "Student not found" });
            return res.status(200).json({ message: "Carry over courses retrieved successfully", courses: student.carryOverCourses });
        } catch (error) {
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
            const results = await Result.find({ student: id, level: level, semester: semester, isReleased: true});
            if (!results.length) return res.status(404).json({ message: "No results found for this semester" });
            const carryOverCourses = results
                .filter(result => {
                    const totalScore = result.testScore + result.examScore;
                    return totalScore < 45; 
                })
                .map(result => result.courseCode);
            student.carryOverCourses = [...new Set([...student.carryOverCourses, ...carryOverCourses])];
            await student.save();
            return res.status(200).json({ 
                message: "Result retrieved successfully and carryover courses updated", 
                results, 
                carryOverCourses: student.carryOverCourses 
            });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    allResults: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: "Student not found" });
            const results = await Result.find({ student: id });
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
            
            const existingResults = await Result.find({ 
                student: id, 
                semester, 
                level,
                isGpaCalculated: true 
            });
            
            if (existingResults.length > 0) {
                return res.status(200).json({ 
                    message: "GPA already calculated for this semester", 
                    gpa: student.cgpa 
                });
            }

            const results = await Result.find({ student: id, semester, level });
            if (!results.length) return res.status(404).json({ message: "No results found for this semester" });
            
            let totalWeightedPoints = 0;
            let totalUnits = 0;
            
            results.forEach(result => {
                const { testScore, examScore, courseCode } = result;
                const totalScore = testScore + examScore;
                let gradePoint;
                if (totalScore >= 70) gradePoint = 5;
                else if (totalScore >= 60) gradePoint = 4;
                else if (totalScore >= 50) gradePoint = 3;
                else if (totalScore >= 45) gradePoint = 2;
                else if (totalScore >= 40) gradePoint = 1;
                else gradePoint = 0;
                
                const courseUnits = coursesData[student.department]?.[student.currentLevel]?.[student.currentSemester]?.[courseCode]?.['Course-Units'] || 0;
                totalWeightedPoints += gradePoint * courseUnits;
                totalUnits += courseUnits;
            });
            const gpa = totalUnits > 0 ? (totalWeightedPoints / totalUnits).toFixed(2) : 0;
            await Result.updateMany(
                { student: id, semester, level },
                { $set: { isGpaCalculated: true } }
            );
            if (!existingResults.length) {
                student.cgpa = ((student.cgpa * student.levelsCompleted) + parseFloat(gpa)) / (student.levelsCompleted + 1);
                student.levelsCompleted += 1;
                await student.save();
            }

            return res.status(200).json({ 
                message: "GPA calculated successfully", 
                gpa, 
                cgpa: student.cgpa 
            });
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