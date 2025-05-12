const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  testScore: { type: Number, default: 0, min: 0 },
  examScore: { type: Number, default: 0, min: 0 },
  gpa: { type: Number, min: 0 },
  semester: { type: String, required: true },
  level: { type: String, required: true },
  released: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);