const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  courseCode: { type: String, required: true, unique: true },
  courseTitle: { type: String, required: true },
  courseUnits: { type: Number, required: true },
  lecturer: { type: Schema.Types.ObjectId, ref: 'Lecturer' },
  department: { type: String },
  semester: { type: String },
  session: { type: String },
  level: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);