const request = require('supertest');
const app = require('../server'); 
const Admin = require('../models/adminModel');
const Student = require('../models/studentModel');
const Lecturer = require('../models/lecturerModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('../models/adminModel');
jest.mock('../models/studentModel');
jest.mock('../models/lecturerModel');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('Admin Controller', () => {
    describe('POST /api/admin/signIn', () => {
        it('should sign in an admin with valid credentials', async () => {
            const mockAdmin = {
                _id: '12345',
                fullName: 'John Doe',
                adminId: 'ABCD1234',
                password: await bcrypt.hash('password123', 10),
            };

            Admin.findOne.mockResolvedValue(mockAdmin);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mockAccessToken');

            const response = await request(app)
                .post('/api/admin/signIn')
                .send({ fullName: 'John Doe', adminId: 'ABCD1234', adminPassword: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Sign in successful');
            expect(response.body).toHaveProperty('access_token', 'mockAccessToken');
        });

        it('should return 404 if admin is not found', async () => {
            Admin.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/admin/signIn')
                .send({ fullName: 'John Doe', adminId: 'ABCD1234', adminPassword: 'password123' });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Admin not found');
        });

        it('should return 401 if password is incorrect', async () => {
            const mockAdmin = {
                _id: '12345',
                fullName: 'John Doe',
                adminId: 'ABCD1234',
                password: await bcrypt.hash('password123', 10),
            };

            Admin.findOne.mockResolvedValue(mockAdmin);
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/admin/signIn')
                .send({ fullName: 'John Doe', adminId: 'ABCD1234', adminPassword: 'wrongPassword' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Wrong password');
        });
    });

    describe('GET /api/admin/profile/:id', () => {
        it('should retrieve an admin profile by ID', async () => {
            const mockAdmin = {
                _id: '12345',
                fullName: 'John Doe',
                email: 'john.doe@example.com',
            };

            Admin.findById.mockResolvedValue(mockAdmin);

            const response = await request(app).get('/api/admin/profile/12345');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Admin profile retrieved successfully');
            expect(response.body.admin).toEqual(mockAdmin);
        });

        it('should return 404 if admin is not found', async () => {
            Admin.findById.mockResolvedValue(null);

            const response = await request(app).get('/api/admin/profile/12345');

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Admin not found');
        });
    });

    describe('POST /api/admin/newStudent', () => {
        it('should create a new student with valid data', async () => {
            const mockStudent = {
                _id: '67890',
                fullName: 'Jane Doe',
                matricNo: 'ABC/12/3456',
            };

            Student.findOne.mockResolvedValue(null);
            Student.prototype.save = jest.fn().mockResolvedValue(mockStudent);

            const response = await request(app)
                .post('/api/admin/newStudent')
                .send({
                    studentInfo: {
                        fullName: 'Jane Doe',
                        email: 'jane.doe@example.com',
                        matricNo: 'ABC/12/3456',
                        currentLevel: '100 Level',
                        currentSemester: 'First Semester',
                        stateOfOrigin: 'Lagos',
                        department: 'Computer Science',
                        dateOfBirth: '2000-01-01',
                        profilePic: 'profile.jpg',
                        phone: '1234567890',
                        yearOfAdmission: '2023',
                        yearOfGraduation: '2027',
                    },
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Student created successfully');
            expect(response.body.newStudent).toEqual(mockStudent);
        });

        it('should return 400 if matric number format is invalid', async () => {
            const response = await request(app)
                .post('/api/admin/newStudent')
                .send({
                    studentInfo: {
                        fullName: 'Jane Doe',
                        matricNo: 'INVALID',
                    },
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid matric number format');
        });

        it('should return 400 if student already exists', async () => {
            const mockStudent = { matricNo: 'ABC/12/3456' };

            Student.findOne.mockResolvedValue(mockStudent);

            const response = await request(app)
                .post('/api/admin/newStudent')
                .send({
                    studentInfo: {
                        fullName: 'Jane Doe',
                        matricNo: 'ABC/12/3456',
                    },
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Student already exists');
        });
    });

    describe('GET /api/admin/allStudents', () => {
        it('should retrieve all students', async () => {
            const mockStudents = [
                { _id: '1', fullName: 'Student One', matricNo: 'ABC/12/3456' },
                { _id: '2', fullName: 'Student Two', matricNo: 'DEF/34/5678' },
            ];

            Student.find.mockResolvedValue(mockStudents);

            const response = await request(app).get('/api/admin/allStudents');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'All students retrieved successfully');
            expect(response.body.students).toEqual(mockStudents);
        });
    });
});