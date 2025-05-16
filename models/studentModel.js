const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  fullName:             { type: String, required: true },
  email:                { type: String, unique: true, sparse: true },
  matricNo:             { type: String, unique: true, required: true, },
  currentLevel:         { type: String },
  currentSemester:      { type: String },
  stateOfOrigin:        { type: String },
  department:           { type: String },
  dateOfBirth:          { type: String },
  cgpa:                 { type: Number, default: 0 }, 
  levelsCompleted:      { type: Number, default: 0 }, 
  currentSession:       { type: String },
  profilePic:           { type: String, default: null },
  phone:                { type: String },
  yearOfAdmission:      { type: String },
  yearOfGraduation:     { type: String }, 
  carryOverCourses:     [{ type: String, default: [] }], 
  registeredCourses:    [{ type: String, default: [] }], 
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);