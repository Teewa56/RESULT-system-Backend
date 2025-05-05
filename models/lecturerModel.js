const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
    fullName: {type: String}, 
    registrationId: {type: String, unique: true, required: true},
    DOB: {type: Date}, 
    phoneNumber: {type: String}, 
    email: {type: String},
    stateOfOrigin: {type: String},
    dateEmployed: {type: Date},
    currentSemester: {type: String},
    coursesTaking: [{type: mongoose.Schema.Types.ObjectId}],
    courseResult: [{type: mongoose.Schema.Types.ObjectId}]
})

module.exports = mongoose.model('Lecturer', lecturerSchema);