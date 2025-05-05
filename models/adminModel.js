const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    fullName: {type: String}, 
    adminId: {type: String, unique: true, required: true},
    adminPassword: {type: String},
    DOB: {type: Date}, 
    phoneNumber: {type: String}, 
    email: {type: String},
    stateOfOrigin: {type: String},
    dateEmployed: {type: Date},
    currentSemester: {type: String},
    studentsResults: [{type: mongoose.Schema.Types.ObjectId}],
    classResults: [{type: mongoose.Schema.Types.ObjectId}],
    students: [{type: mongoose.Schema.Types.ObjectId}],
    lecturers: [{type: mongoose.Schema.Types.ObjectId}],
    admins: [{type: mongoose.Schema.Types.ObjectId}]
})

module.exports = mongoose.model('Admin', adminSchema);