const Admin = require('../models/adminModel');
const Lecturer = require('../models/lecturerModel');
const Student = require('../models/studentModel');
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
            if (!adminIdRegex.test(userId)) return res.status(401).json({ message: 'Invalid admin ID format' });
            const admin = await Admin.findOne({ adminId: userId });
            if (!admin) return res.status(404).json({ message: 'Admin not found' });
            if (admin.fullName.toLocaleLowerCase() !== fullName.toLocaleLowerCase()) return res.status(401).json({ message: 'Wrong name' });
            if (!(await bcrypt.compare(adminPassword, admin.hashedPassword))) return res.status(402).json({ message: 'Wrong password' });
            const access_token = adminController.creatAccessToken({ id: admin._id });
            const refresh_token = adminController.createRefreshToken({ id: admin._id });
            res.cookie('refresh_token', refresh_token, {
                httpOnly: true,
                path: '/api/admin/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ message: 'Sign in successful', access_token, admin });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/admin/refresh_token' });
            return res.status(200).json({ msg: "Logged out" });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    adminProfile: async (req, res) => {
        const { adminId } = req.params; 
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) return res.status(404).json({ message: 'Admin not found' });
            return res.status(200).json({ message: 'Admin profile retrieved successfully', admin });
        } catch (error) {
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
                const existingAdmin = await Admin.findOne({ email: email });
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
                admin.normalPassword = password;
                admin.hashedPassword = await bcrypt.hash(password, 13);
            }
            await admin.save();
            return res.status(200).json({ message: 'Admin profile updated successfully', admin });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    newAdmin: async (req, res) => {
        const { adminInfo } = req.body;
        const { fullName, email, adminId, dateOfBirth, dateOfEmployment, stateOfOrigin, phone, gender, profilePic } = adminInfo;

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
                dateOfEmployment: dateOfEmployment,
                phone: phone,
                gender: gender,
                profilePic: profilePic,
                hashedPassword: hashedPassword,
                normalPassword: plainPassword,
            });
            await newAdmin.save();
            return res.status(201).json({
                message: 'Admin created successfully',
                newAdmin,
                plainPassword, 
            });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },
    newStudent: async (req, res) => {
        const { studentInfo } = req.body;
        const {fullName, email, matricNo, currentLevel, currentSemester, currentSession, stateOfOrigin, department, dateOfBirth, profilePic, phone, yearOfAdmission, yearOfGraduation } = studentInfo
        try {
            const matricNumberRegex = /^[A-Za-z]{3}\/\d{2}\/\d{4}$/;
            if (!matricNumberRegex.test(matricNo)) return res.status(400).json({ message: 'Invalid matric number format' });

            const student = await Student.findOne({ matricNo: matricNo });
            if (student) return res.status(400).json({ message: 'Student already exists' });
            let registeredCourses = [];
            const semesterKey = currentSemester;
        
            if (coursesData[department] && 
            coursesData[department][currentLevel] && 
            coursesData[department][currentLevel][semesterKey]) {
                registeredCourses = coursesData[department][currentLevel][semesterKey].map(
                    course => course["Course-Code"]
                );
            }
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
                registeredCourses: registeredCourses
            });
            await newStudent.save();
            return res.status(201).json({ message: 'Student created successfully', newStudent });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    newLecturer: async (req, res) => {
        const { lecturerInfo } = req.body;
        const { fullName, email, registrationId, stateOfOrigin, department, dateOfBirth, profilePic, phone, dateEmployed, gender, coursesTaking } = lecturerInfo;
        try {
            const lecturerIdRegex = /^[A-Za-z]{4}\/\d{4}$/;
            if (!lecturerIdRegex.test(registrationId)) return res.status(400).json({ message: 'Invalid registration ID format' });

            const lecturerExists = await Lecturer.findOne({ registrationId });
            if (lecturerExists) return res.status(400).json({ message: 'Lecturer already exists' });

            const assignedCourses = await Lecturer.find({ coursesTaking: { $in: coursesTaking } }, 'coursesTaking');
            const assignedCourseCodes = assignedCourses.flatMap(l => l.coursesTaking);

            const unassignedCourses = coursesTaking.filter(course => !assignedCourseCodes.includes(course));

            if (unassignedCourses.length === 0) {
                return res.status(400).json({ message: 'All selected courses are already assigned to other lecturers' });
            }

            const newLecturer = new Lecturer({
                fullName: fullName,
                email: email,
                registrationId: registrationId,
                stateOfOrigin: stateOfOrigin,
                department: department,
                dateOfBirth: dateOfBirth,
                profilePic: profilePic,
                phone: phone,
                gender: gender,
                dateEmployed: dateEmployed,
                coursesTaking: unassignedCourses,
            });
            await newLecturer.save();
            return res.status(201).json({ message: 'Lecturer created successfully', newLecturer, assignedCourses: assignedCourseCodes });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allStudents: async (req, res) => {
        try {
            const students = await Student.find();
            return res.status(200).json({ message: 'All students retrieved successfully', students });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allLecturers: async (req, res) => {
        try {
            const lecturers = await Lecturer.find();
            return res.status(200).json({ message: 'All lecturers retrieved successfully', lecturers });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    allAdmins: async (req, res) => {
        try {
            const admins = await Admin.find();
            return res.status(200).json({ message: 'All admins retrieved successfully', admins });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    searchStudent: async (req, res) => {
        const { search } = req.params;
        try {
            const formattedSearch = search.toUpperCase();
            const results = await Student.find({
                $or: [
                    { fullName: { $regex: search } },
                    { matricNo: { $regex: formattedSearch } },
                ],
            });
            if (!results.length) return res.status(404).json({ message: 'No students found matching the search criteria' });
            return res.status(200).json({ message: 'Search results', results });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    searchLecturer: async (req, res) => {
        const { search } = req.body;
        try {
            const formattedSearch = search.toUpperCase();
            const results = await Lecturer.find({
                $or: [
                    { fullName: { $regex: search } },
                    { registrationId: { $regex: formattedSearch } },
                ],
            });
            if (!results.length) return res.status(404).json({ message: 'No lecturers found matching the search criteria' });
            return res.status(200).json({ message: 'Search results', results });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    resultPreview: async (req, res) => {
        const { data } = req.body;
        const { level, department, semester } = data;

        try {
            const students = await Student.find({
            currentLevel: level,
            department,
            currentSemester: semester
        });

        const results = await Promise.all(students.map(async (student) => {
            const studentResults = await Result.find({
                student: student._id,
                level,
                semester
            });

            return {
                studentId: student._id,
                fullName: student.fullName,
                matricNo: student.matricNo,
                results: studentResults
            };
        }));

        return res.status(200).json({
            message: 'Results retrieved successfully',
            results
        });

        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    closeResultSubmission: async (req, res) => {
        try {
            await Result.updateMany({}, { $set: { isClosed: true } });
            return res.status(200).json({ message: 'All courses result submission closed' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    releaseResult: async (req, res) => {
        try {
            const results = await Result.find({isReleased: false, isClosed: true});
            if (!results.length) return res.status(404).json({ message: 'No results available to release' });
            await Result.updateMany({}, { $set: { isReleased: true } });
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
                    student.currentSession = `${parseInt(student.currentSession.split('/')[0]) + 1}/${parseInt(student.currentSession.split('/')[1]) + 1}`;
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
        try {
            const { department, level, semester } = req.query;
            if (!department || !level || !semester) {
                return res.status(400).json({ 
                    message: 'Department, level, and semester are required parameters' 
                });
            }
            const courses = coursesData[department][level][semester] || [];
            if (!courses.length) {
                return res.status(404).json({ 
                    message: 'No courses found for the specified criteria' 
                });
            }
            return res.status(200).json({ 
                message: 'Course information retrieved successfully', 
                courses 
            });
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
    getCurrentSemester: async(req, res) => {
        try {
            const student = await Student.findOne();
            if (!student) return res.status(404).json({ message: 'No student found' });
            const currentSemester = student.currentSemester;
            return res.status(200).json({ message: 'Current Semester', currentSemester }); 
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