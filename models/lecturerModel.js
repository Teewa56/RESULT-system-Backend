const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lecturerSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  registrationId: { type: String, required: true, unique: true },
  stateOfOrigin: { type: String },
  dateOfBirth: { type: Date },
  department: { type: String },
  profilePic: { type: String },
  phone: { type: String },
  dateEmployed: { type: Date },
  coursesTaking: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Lecturer', lecturerSchema);