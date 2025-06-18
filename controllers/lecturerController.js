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
            if (!lecturerIdRegex.test(userId)) return res.status(401).json({ message: 'Invalid registration ID format' });
            const lecturer = await Lecturer.findOne({ registrationId: userId });
            if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });
            if(lecturer.fullName.toLocaleLowerCase().trim() !== fullName.toLocaleLowerCase().trim()) return res.status(401).json({message: 'Wrong name'})
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
            res.clearCookie('refreshtoken', { path: '/api/lecturer/refresh_token' });
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
            if (!lecturer || !lecturer.coursesTaking || !lecturer.coursesTaking.length) {
                return res.status(404).json({ message: 'No courses found for this lecturer' });
            }
            const coursesTaking = lecturer.coursesTaking;
            let allCourses = [];
            for (const dept in coursesData) {
                for (const level in coursesData[dept]) {
                    for (const semester in coursesData[dept][level]) {
                        const semesterCourses = coursesData[dept][level][semester];
                        
                        if (Array.isArray(semesterCourses)) {
                            const filtered = semesterCourses
                                .filter(course => coursesTaking.includes(course['Course-Code']))
                                .map(course => ({
                                    ...course,
                                    "Semester": semester
                                }));
                            allCourses = [...allCourses, ...filtered];
                        } else if (typeof semesterCourses === 'object' && semesterCourses !== null) {
                            for (const code of coursesTaking) {
                                if (semesterCourses['Course-Code'] === code) {
                                    allCourses.push({
                                        ...semesterCourses,
                                        "Semester": semester
                                    });
                                } else if (semesterCourses[code]) {
                                    allCourses.push({
                                        ...semesterCourses[code],
                                        "Semester": semester
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            if (!allCourses.length) {
                const courses = coursesTaking.map(courseCode => ({
                    "Course-Code": courseCode
                }));
                return res.status(200).json({
                    message: 'Basic course information retrieved successfully',
                    courses
                });
            }
            const uniqueCourses = [];
            const trackDuplicates = new Set();
            for (const course of allCourses) {
                const uniqueKey = `${course['Course-Code']}_${course['Semester']}`;
                if (!trackDuplicates.has(uniqueKey)) {
                    trackDuplicates.add(uniqueKey);
                    uniqueCourses.push(course);
                }
            }
            
            return res.status(200).json({
                message: 'All courses retrieved successfully with semester information',
                courses: uniqueCourses
            });
        } catch (error) {
            console.error('Error in coursesTaking:', error);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseTaking: async (req, res) => {
        const { courseCode } = req.params;
        try {
            let course = null;
            for (const dept in coursesData) {
                for (const level in coursesData[dept]) {
                    for (const sem in coursesData[dept][level]) {
                        const courses = coursesData[dept][level][sem];
                        if (Array.isArray(courses)) {
                            const found = courses.find(c => c['Course-Code'] === courseCode);
                            if (found) {
                                course = found;
                                break;
                            }
                        } else if (typeof courses === 'object' && courses !== null) {
                            if (courses['Course-Code'] === courseCode) {
                                course = courses;
                                break;
                            }
                        }
                    }
                    if (course) break;
                }
                if (course) break;
            }
            
            if (!course) return res.status(404).json({ message: 'Course not found' });
            const student = await Student.findOne({ registeredCourses: courseCode });
            const crs = await Result.findOne({ courseCode, student: student._id });
            let uploaded = false;
            if (crs && crs.isUploaded === true) {
                uploaded = true;
            }
            
            let isClosed = false;
            if (crs && crs.isClosed === true) {
                isClosed = true;
            }
            
            return res.status(200).json({ 
                message: 'Course retrieved successfully', 
                course, 
                uploaded, 
                isClosed 
            });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getRegisteredStudents: async (req, res) => {
        const {courseCode} = req.params;
        try {
            const students = await Student.find({
                registeredCourses: courseCode
            })
            return res.status(200).json({
                message: 'Registered students retrieved',
                students
            });
        } catch (error) {
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    getCourseResults: async (req, res) => {
        const { lecturerId } = req.params;
        const { courseCode } = req.query;
        try {
            const student = await Student.findOne({ registeredCourses: courseCode });
            if (!student) {
                return res.status(404).json({ message: 'No students currently registered for this course' });
            }
            const { currentSemester, currentLevel } = student;
            const results = await Result.find({
                courseCode,
                lecturer: lecturerId,
                semester: currentSemester,
                level: currentLevel
            }).populate('student', 'fullName matricNo');
            if (!results.length) {
                return res.status(404).json({ message: 'No results found for this course in the current semester/level' });
            }
            return res.status(200).json({
                message: 'Course results retrieved successfully',
                results
            });
        } catch (error) {
            console.error('Error in getCourseResults:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    uploadCourseResults: async (req, res) => {
        const { lecturerId } = req.params;
        const { data } = req.body;
        const { results } = data || {};
        try {
            if (!results || !Array.isArray(results)) {
                return res.status(400).json({ 
                    message: 'Invalid request format: results array is required' 
                });
            }
            const lecturer = await Lecturer.findById(lecturerId);
            if (!lecturer) {
                return res.status(404).json({ message: 'Lecturer not found' });
            }
            const assignedCourses = lecturer.coursesTaking;
            const uploadedResults = [];
            const errors = [];
            for (const result of results) {
                try {
                    const student = await Student.findById(result.studentId);
                    if (!student) {
                        errors.push(`Student with ID ${result.studentId} not found`);
                        continue;
                    }
                    const course = assignedCourses.find(c => 
                        (typeof c === 'string' ? c : c.courseCode) === result.courseCode
                    );
                    if (!course) {
                        errors.push(`Course ${result.courseCode} not assigned to lecturer`);
                        continue;
                    }
                    if (result.testScore < 0 || result.testScore > 40 || 
                        result.examScore < 0 || result.examScore > 60) {
                        errors.push(`Invalid scores for student ${result.studentId}, course ${result.courseCode}`);
                        continue;
                    }
                    const existingResult = await Result.findOne({
                        student: result.studentId,
                        courseCode: result.courseCode,
                        semester: student.currentSemester,
                        level: student.currentLevel
                    });
                    
                    if (existingResult) {
                        if (existingResult.isReleased) {
                            errors.push(`Result for student ${result.studentId}, course ${result.courseCode} has already been released`);
                            continue;
                        }
                        existingResult.testScore = result.testScore;
                        existingResult.examScore = result.examScore;
                        await existingResult.save();
                        uploadedResults.push(existingResult);
                    } else {
                        const newResult = await Result.create({
                            student: result.studentId,
                            courseCode: typeof course === 'string' ? course : course.courseCode,
                            testScore: result.testScore,
                            examScore: result.examScore,
                            semester: student.currentSemester,
                            level: student.currentLevel,
                            lecturer: lecturerId,
                            isUploaded: true,
                        });
                        uploadedResults.push(newResult);
                    }
                } catch (innerError) {
                    errors.push(`Error processing result for student ${result.studentId}: ${innerError.message}`);
                }
            }
            return res.status(200).json({
                message: 'Results processing completed',
                resultsUploaded: uploadedResults.length,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            console.error('Error in uploadCourseResults:', error.message);
            return res.status(500).json({ message: `Server error: ${error.message}` });
        }
    },

    editCourseResults: async (req, res) => {
        const { lecturerId } = req.params;
        const { data } = req.body;
        try {
            const lecturer = await Lecturer.findById(lecturerId);
            if (!lecturer) {
                return res.status(404).json({ message: 'Lecturer not found' });
            }            
            const isAssignedCourse = lecturer.coursesTaking.some(c => 
                (typeof c === 'string' ? c : c.courseCode) === data.courseCode
            );
            if (!isAssignedCourse) {
                return res.status(403).json({ 
                    message: 'You are not authorized to edit results for this course' 
                });
            }
            if (data.testScore < 0 || data.testScore > 40 || 
                data.examScore < 0 || data.examScore > 60) {
                return res.status(400).json({ 
                    message: 'Invalid test or exam scores. Test score must be 0-40, exam score 0-60.' 
                });
            }
            const result = await Result.findOne({
                courseCode: data.courseCode,
                student: data.studentId
            });
            if (!result) {
                return res.status(404).json({ message: 'Result not found' });
            }
            if (result.isReleased) {
                return res.status(403).json({ 
                    message: 'Cannot edit result that has already been released' 
                });
            }
            if (result.isGpaCalculated) {
                return res.status(403).json({ 
                    message: 'Cannot edit result that has already been used in GPA calculation' 
                });
            }
            result.testScore = data.testScore;
            result.examScore = data.examScore;
            await result.save();
            
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