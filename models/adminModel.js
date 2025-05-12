const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  adminId: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date },
  stateOfOrigin: { type: String },
  phone: { type: String },
  gender: { type: String },
  profilePic: { type: String },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);