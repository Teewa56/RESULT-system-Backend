const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: {type: String},
    matricNo: {type: String, unique: true, required: true},
    level: {type: String},
    profilePic: {type: String}, 
    DOB: {type: Date},
    phone: {type: String},
    email: {type: String},
    stateOfOrigin: {type: String},
    department: {type: String},
    dateRegistered: {type: String},
    dateOfGraduation: {type: String},
    currentSemester: {type: String},
    registeredCourses: [{type: mongoose.Schema.Types.ObjectId}],
    carryOverCourses: [{type: mongoose.Schema.Types.ObjectId}],
    studentResults: [{type: mongoose.Schema.Types.ObjectId}]
})

module.exports = mongoose.model('Student', studentSchema)