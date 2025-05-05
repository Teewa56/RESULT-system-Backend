const mongoose = require('mongoose');

const studentResultSchema = new mongoose.Schema({
    level: {type: String}, 
    department: {type: String},
    student: {type: mongoose.Schema.Types.ObjectId},
    courses: [{type: mongoose.Schema.Types.ObjectId}],
    testScores: [{type: Number}],
    examScores: [{type: Number}],
    grades: [{type: String}]
})

module.exports = mongoose.model('StudentResult', studentResultSchema);