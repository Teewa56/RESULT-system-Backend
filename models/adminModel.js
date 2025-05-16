const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  fullName:         { type: String, required: true },
  email:            { type: String, unique: true, sparse: true },
  adminId:          { type: String, unique: true, required: true },
  dateOfBirth:      { type: String },
  dateOfEmployment: { type: String },
  stateOfOrigin:    { type: String },
  phone:            { type: String },
  gender:           { type: String },
  profilePic:       { type: String, default: null },
  hashedPassword:   { type: String, required: true},
  normalPassword:   { type: String, required: true}
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);