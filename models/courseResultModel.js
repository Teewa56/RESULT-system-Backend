const mongoose = require('mongoose');

const courseResultSchema = new mongoose.Schema({
    level: {type: String}, 
    department: {type: String},
    students: [{type: mongoose.Schema.Types.ObjectId}],
    testScores: [{type: Number}],
    examScores: [{type: Number}],
    grades: [{type: String}],
    stillSubmitting: {type: Boolean, default: true}
})

module.exports = mongoose.model('CourseResult', courseResultSchema);