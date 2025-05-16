const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resultSchema = new Schema({
  student:      { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  courseCode:   { type: String, required: true },
  testScore:    { type: Number, default: 0, min: 0 },
  examScore:    { type: Number, default: 0, min: 0 },
  grade:        { type: String, default: 'F' },
  semester:     { type: String, required: true },
  level:        { type: String, required: true },
  isClosed:     { type: Boolean, default: false},
  lecturer:     { type: Schema.Types.ObjectId, ref: 'Lecturer', required: true },
  isReleased:   { type: Boolean, default: false },
  isGpaCalculated: { type: Boolean, default: false }
}, { timestamps: true });

resultSchema.index({student: 1, courseCode: 1, semester: 1}, {unique: true});

module.exports = mongoose.model('Result', resultSchema);