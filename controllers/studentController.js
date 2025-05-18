const Student = require('../models/studentModel');
const Result = require('../models/resultModels');
const jwt = require('jsonwebtoken');
const coursesData = require('../courses.json');

const studentController = {
    signIn: async (req, res) => {
        const { data } = req.body;
        const { fullName, userId } = data;
        try {
            const matricNumberRegex = /^[A-Za-z]{3}\/\d{2}\/\d{4}$/;
            if (!matricNumberRegex.test(userId)) return res.status(401).json({ message: "Invalid matric number format" });
            const student = await Student.findOne({ matricNo: userId });
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.fullName.toLocaleLowerCase() !== fullName.toLocaleLowerCase()) return res.status(401).json({ message: "Invalid credentials" });
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
            res.clearCookie('refreshtoken', { path: '/api/student/refresh_token' });
            return res.json({ msg: "Logged out" });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    studentProfile: async (req, res) => {
        const { studentId } = req.params;
        try {
            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: "Student not found" });
            return res.status(200).json({ message: "Student profile retrieved successfully", student });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    carryOverCourses: async (req, res) => {
        const { studentId } = req.params;
        try {
            const student = await Student.findById(studentId).populate('carryOverCourses');
            if (!student) return res.status(404).json({ message: "Student not found" });
            return res.status(200).json({ message: "Carry over courses retrieved successfully", courses: student.carryOverCourses });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    },
    
    result: async (req, res) => {
        const { studentId } = req.params;
        const { data } = req.body;
        const {level, semester} = data;
        try {
            const student = await Student.findById(studentId);
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

    getRegisteredCourses: async (req, res) => {
        const { studentId } = req.params;
        try {
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }
            const { registeredCourses = [], department } = student;
            const departmentCourses = coursesData[department];
            if (!departmentCourses) {
                return res.status(404).json({ message: "Department not found in courses data" });
            }
            const allCourses = Object.values(departmentCourses).flatMap(level =>
                Object.values(level).flat()
            );
            const matchedCourses = registeredCourses.map(code => {
                return allCourses.find(course => course["Course-Code"] === code);
            }).filter(course => course); 
            return res.status(200).json({ courses: matchedCourses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    allResults: async (req, res) => {
        const { studentId } = req.params;
        try {
            const results = await Result.find({ student: studentId, isReleased: true });
            if (!results.length) return res.status(404).json({ message: "No results found" });
            return res.status(200).json({ message: "All results retrieved successfully", results });
        } catch (error) {
            console.error('Error in allResults:', error.message);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
    getGPA: async (req, res) => {
        const { studentId } = req.params;
        const { semester, level } = req.body;
        
        try {
            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: "Student not found" });
            
            const existingResults = await Result.find({
                student: studentId,
                semester,
                level,
                isGpaCalculated: true
            });
            
            if (existingResults.length > 0) {
                return res.status(200).json({
                    message: "GPA already calculated for this semester",
                    cgpa: student.cgpa,
                    gpa: student.semesterGPA
                });
            }
            
            const results = await Result.find({ student: studentId, semester, level, isReleased: true });
            if (!results.length) return res.status(404).json({ message: "No results found for this semester" });
            
            let totalWeightedPoints = 0;
            let totalUnits = 0;
            
            for (const result of results) {
                const { testScore, examScore, courseCode } = result;
                const totalScore = testScore + examScore;
                let gradePoint;
                
                if (totalScore >= 70) gradePoint = 5;
                else if (totalScore >= 60) gradePoint = 4;
                else if (totalScore >= 50) gradePoint = 3;
                else if (totalScore >= 45) gradePoint = 2;
                else if (totalScore >= 40) gradePoint = 1;
                else gradePoint = 0;
                
                const courseInfo = coursesData[student.department]?.[level]?.[semester]?.find(
                    course => course['Course-Code'] === courseCode
                );
                
                if (!courseInfo) {
                    console.warn(`Course info not found for course code: ${courseCode}`);
                    continue;
                }
                
                const courseUnits = courseInfo['Course-Units'] || 0;
                totalWeightedPoints += gradePoint * courseUnits;
                totalUnits += courseUnits;
            }
            
            const gpa = totalUnits > 0 ? (totalWeightedPoints / totalUnits).toFixed(2) : 0;
            const semesterGPA = parseFloat(gpa); 
            
            await Result.updateMany(
                { student: studentId, semester, level },
                { $set: { isGpaCalculated: true } }
            );
            
            if (!existingResults.length) {
                student.semesterGPA = semesterGPA;
                student.cgpa = ((student.cgpa * student.levelsCompleted) + semesterGPA) / (student.levelsCompleted + 1);
                student.levelsCompleted += 1;
                await student.save();
            } else {
                await Student.findByIdAndUpdate(studentId, {
                    $set: { semesterGPA }
                });
            }
            
            return res.status(200).json({
                message: "GPA calculated successfully",
                gpa: semesterGPA,
                cgpa: student.cgpa
            });
        } catch (error) {
            console.error('Error in getGPA:', error.message);
            return res.status(500).json({ message: "Internal server error", error: error.message });
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