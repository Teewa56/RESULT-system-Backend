const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  matricNo: { type: String, required: true, unique: true },
  currentLevel: { type: String },
  currentSemester: { type: String },
  stateOfOrigin: { type: String },
  department: { type: String },
  dateOfBirth: { type: Date },
  cgpa: { type: Number, default: 0 }, 
  levelsCompleted: { type: Number, default: 0 }, 
  currentSession: { type: String },
  profilePic: { type: String },
  phone: { type: String },
  yearOfAdmission: { type: Number },
  yearOfGraduation: { type: Number },
  results: [{ type: Schema.Types.ObjectId, ref: 'Result', default: [] }], 
  carryOverCourses: [{ type: Schema.Types.ObjectId, ref: 'Course', default: [] }], 
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);