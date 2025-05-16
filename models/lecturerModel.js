const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lecturerSchema = new Schema({
  fullName:         { type: String, required: true },
  email:            { type: String, unique: true, sparse: true },
  registrationId:   { type: String, unique: true, required: true},
  stateOfOrigin:    { type: String },
  dateOfBirth:      { type: String },
  department:       { type: String },
  profilePic:       { type: String, default: null },
  phone:            { type: String },
  gender:           { type: String },
  dateEmployed:     { type: String },
  coursesTaking:    [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Lecturer', lecturerSchema);