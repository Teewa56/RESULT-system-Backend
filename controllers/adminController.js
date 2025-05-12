const Admin = require('../models/adminModel');
const Lecturer = require('../models/lecturerModel');
const Student = require('../models/studentModel');
const Course = require('../models/courseModel');
const Result = require('../models/resultModels');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const coursesData = require('../courses.json');
const crypto = require('crypto');
require('dotenv').config();

const adminController = {
    signIn: async (req, res) => {
        const { data } = req.body;
        const {fullName, userId, adminPassword} = data;
        try {
            const adminIdRegex = /^[A-Z]{4}\/\d{4}$/;
            if (!adminIdRegex.test(userId)) return res.status(400).json({ message: 'Invalid admin ID format' });
            const admin = await Admin.findOne({ adminId: userId });
            if (!admin) return res.status(404).json({ message: 'Admin not found' });
            if (admin.fullName !== fullName) return res.status(401).json({ message: 'Wrong name' });
            if (!(await bcrypt.compare(adminPassword, admin.password))) return res.status(401).json({ message: 'Wrong password' });
            const access_token = adminController.creatAccessToken({ id: admin._id });
            const refresh_token = adminController.createRefreshToken({ id: admin._id });
            res.cookie('refresh_token', refresh_token, {
                httpOnly: true,
                path: '/api/admin/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ message: 'Sign in successful', access_token, admin });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/refresh_token' });
            return res.status(200).json({ msg: "Logged out" });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    adminProfile: async (req, res) => {
        const { id } = req.params;
        try {
            const admin = await Admin.findById(id);
            if (!admin) return res.status(404).json({ message: 'Admin not found' });
            return res.status(200).json({ message: 'Admin profile retrieved successfully', admin });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    editAdminProfile: async (req, res) => {
        const adminId = req.user.id;
        const { data } = req.body;
        const {fullName, email, dateOfBirth, stateOfOrigin, phone, gender, profilePic, password} = data
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) return res.status(404).json({ message: 'Admin profile not found' });

            if (email) {
                const existingAdmin = await Admin.findOne({ email });
                if (existingAdmin && existingAdmin.id !== adminId) {
                    return res.status(400).json({ message: 'Email is already in use' });
                }
            }

            if (fullName) admin.fullName = fullName;
            if (email) admin.email = email;
            if (dateOfBirth) admin.dateOfBirth = dateOfBirth;
            if (stateOfOrigin) admin.stateOfOrigin = stateOfOrigin;
            if (phone) admin.phone = phone;
            if (gender) admin.gender = gender;
            if (profilePic) admin.profilePic = profilePic;
            if (password) {
                admin.password = await bcrypt.hash(password, 13);
            }

            await admin.save();
            return res.status(200).json({ message: 'Admin profile updated successfully', admin });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    newAdmin: async (req, res) => {
    const { adminInfo } = req.body;
    const { fullName, email, adminId, dateOfBirth, stateOfOrigin, phone, gender, profilePic } = adminInfo;

    try {
        const adminIdRegex = /^[A-Z]{4}\/\d{4}$/;
        if (!adminIdRegex.test(adminId)) return res.status(400).json({ message: 'Invalid admin ID format' });
        const admin = await Admin.findOne({ adminId });
        if (admin) return res.status(400).json({ message: 'Admin already exists' });
        const generatePassword = (length = 8) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            return Array.from(crypto.randomFillSync(new Uint8Array(length)))
                .map((x) => chars[x % chars.length])
                .join('');
        };
        const plainPassword = generatePassword(8); 
        const hashedPassword = await bcrypt.hash(plainPassword, 13); 
        const newAdmin = new Admin({
            fullName: fullName,
            email: email,
            adminId: adminId,
            dateOfBirth: dateOfBirth,
            stateOfOrigin: stateOfOrigin,
            phone: phone,
            gender: gender,
            profilePic: profilePic,
            password: hashedPassword,
        });
        await newAdmin.save();
        return res.status(201).json({
            message: 'Admin created successfully',
            newAdmin,
            plainPassword, 
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: `Server error: ${error.message}` });
    }
},
    newStudent: async (req, res) => {
        const { studentInfo } = req.body;
        const {fullName, email, matricNo, currentLevel, currentSemester, currentSession, stateOfOrigin, department, dateOfBirth, profilePic, phone, yearOfAdmission, yearOfGraduation } = studentInfo
        try {
            const matricNumberRegex = /^[A-Za-z]{3}\/\d{2}\/\d{4}$/;
            if (!matricNumberRegex.test(matricNo)) return res.status(400).json({ message: 'Invalid matric number format' });

            const student = await Student.findOne({ matricNo });
            if (student) return res.status(400).json({ message: 'Student already exists' });

            const newStudent = new Student({
                fullName: fullName ,
                email: email ,
                matricNo: matricNo,
                currentLevel: currentLevel,
                currentSemester: currentSemester,
                currentSession: currentSession,
                stateOfOrigin: stateOfOrigin,
                department: department,
                dateOfBirth: dateOfBirth,
                profilePic: profilePic,
                phone: phone,
                yearOfAdmission: yearOfAdmission,
                yearOfGraduation: yearOfGraduation,
            });
            await newStudent.save();
            return res.status(201).json({ message: 'Student created successfully', newStudent });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    newLecturer: async (req, res) => {
        const { lecturerInfo } = req.body;
        const { fullName, email, registrationId, stateOfOrigin, department, dateOfBirth, profilePic, phone, dateEmployed, coursesTaking } = lecturerInfo;
        try {
            const lecturerIdRegex = /^[A-Za-z]{4}\/\d{4}$/;
            if (!lecturerIdRegex.test(registrationId)) return res.status(400).json({ message: 'Invalid registration ID format' });

            const lecturerExists = await Lecturer.findOne({ registrationId });
            if (lecturerExists) return res.status(400).json({ message: 'Lecturer already exists' });

            const newLecturer = new Lecturer({
                fullName: fullName,
                email: email,
                registrationId: registrationId,
                stateOfOrigin: stateOfOrigin,
                department: department,
                dateOfBirth: dateOfBirth,
                profilePic: profilePic,
                phone: phone,
                dateEmployed: dateEmployed,
                coursesTaking: coursesTaking,
            });
            await newLecturer.save();

            await Course.updateMany(
                { courseCode: { $in: coursesTaking } },
                { $set: { lecturer: newLecturer._id } }
            );

            return res.status(201).json({ message: 'Lecturer created successfully', newLecturer });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allStudents: async (req, res) => {
        try {
            const students = await Student.find();
            return res.status(200).json({ message: 'All students retrieved successfully', students });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allLecturers: async (req, res) => {
        try {
            const lecturers = await Lecturer.find();
            return res.status(200).json({ message: 'All lecturers retrieved successfully', lecturers });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allAdmins: async (req, res) => {
        try {
            const admins = await Admin.find();
            return res.status(200).json({ message: 'All admins retrieved successfully', admins });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    searchStudent: async (req, res) => {
        const { search } = req.params;
        try {
            const results = await Student.find({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { matricNo: { $regex: search, $options: 'i' } },
                ],
            });
            if (!results.length) return res.status(404).json({ message: 'No students found matching the search criteria' });
            return res.status(200).json({ message: 'Search results', results });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    searchLecturer: async (req, res) => {
        const { search } = req.body;
        try {
            const results = await Lecturer.find({
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { registrationId: { $regex: search, $options: 'i' } },
                ],
            });
            if (!results.length) return res.status(404).json({ message: 'No lecturers found matching the search criteria' });
            return res.status(200).json({ message: 'Search results', results });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    resultPreview: async (req, res) => {
        const { data } = req.body;
        const {level, department, semester} = data;
        try {
            const students = await Student.find({ level, department, semester }).populate('courses.courseCode courses.lecturer');
            if (!students.length) return res.status(404).json({ message: 'No results found for the specified criteria' });
            const results = students.map(student => ({
                studentId: student._id,
                fullName: student.fullName,
                matricNo: student.matricNo,
                courses: student.courses.map(course => ({
                    courseCode: course.courseCode,
                    courseTitle: course.courseTitle,
                    score: course.score,
                    grade: course.grade,
                })),
            }));
            return res.status(200).json({ message: 'Results', results });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    closeResultSubmission: async (req, res) => {
        try {
            await Course.updateMany({}, { $set: { submissionClosed: true } });
            return res.status(200).json({ message: 'All courses result submission closed' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    releaseResult: async (req, res) => {
        try {
            const results = await Result.find();
            if (!results.length) return res.status(404).json({ message: 'No results available to release' });

            await Result.updateMany({}, { $set: { released: true } });
            return res.status(200).json({ message: 'Results released successfully' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    registerCoursesForSemester: async (req, res) => {
        try {
            const students = await Student.find();
            for (const student of students) {
                const { department, currentLevel, currentSemester } = student;
                const courses = coursesData[department]?.[currentLevel]?.[currentSemester] || [];
                student.registeredCourses = courses.map(course => course['Course-Code']);
                await student.save();
            }
            return res.status(200).json({ message: 'Courses registered for all students' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    updateStudentSemesterLevel: async (req, res) => {
        try {
            const students = await Student.find();
            for (const student of students) {
                if (student.currentLevel === 'Graduated') continue;
                if (student.currentLevel === 'Final Year' && student.currentSemester === 'Second Semester') {
                    student.currentLevel = 'Graduated';
                    student.currentSemester = 'Graduated';
                    student.currentSession = 'Graduated';
                    student.levelsCompleted += 1;
                } else if (student.currentSemester === 'Second Semester' && student.currentLevel !== 'Final Year') {
                    student.currentLevel = `${parseInt(student.currentLevel) + 100} Level`;
                    student.currentSemester = 'First Semester';
                    student.currentSession = `${parseInt(student.currentSession) + 1} Session`;
                    student.levelsCompleted += 1;
                } else {
                    student.currentSemester = 'Second Semester';
                }
                await student.save();
            }
            return res.status(200).json({ message: 'Student semester and level updated' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseInfo: async (req, res) => {
        const { data} = req.body;
        const {department, level, semester } = data;
        try {
            const courses = coursesData[department]?.[level]?.[semester] || [];
            if (!courses.length) return res.status(404).json({ message: 'No courses found for the specified criteria' });

            return res.status(200).json({ message: 'Course information retrieved successfully', courses });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    studentProfile: async (req, res) => {
        const { id } = req.params;
        try {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: 'Student not found' });
            return res.status(200).json({ message: 'Student profile retrieved successfully', student });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    lecturerProfile: async (req, res) => {
        const { id } = req.params;
        try {
            const lecturer = await Lecturer.findById(id);
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
            return res.status(200).json({ message: 'Lecturer profile retrieved successfully', lecturer });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    editStudentInfo: async (req, res) => {
        const { id } = req.params;
        const { studentInfo } = req.body;
        try {
            const student = await Student.findByIdAndUpdate(id, studentInfo, { new: true });
            if (!student) return res.status(404).json({ message: 'Student not found' });

            return res.status(200).json({ message: 'Student information updated successfully', student });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    editLecturerInfo: async (req, res) => {
        const { id } = req.params;
        const { lecturerInfo } = req.body;
        try {
            const lecturer = await Lecturer.findByIdAndUpdate(id, lecturerInfo, { new: true });
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

            return res.status(200).json({ message: 'Lecturer information updated successfully', lecturer });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    generateToken: async (req, res) => {
            try {
                const rf_token = req.cookies.refreshtoken;
                if (!rf_token) return res.status(400).json({ message: "Please login now" });
                jwt.verify(rf_token, process.env.REFRESHTOKENSECRET, async (err, result) => {
                    if (err) return res.status(400).json({ message: "Invalid token" });
                    const user = await Admin.findById(result.id);
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

    creatAccessToken: (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    },

    createRefreshToken: (payload) => {
        return jwt.sign(payload, process.env.REFRESHTOKENSECRET, { expiresIn: '7d' });
    },
};

module.exports = adminController;