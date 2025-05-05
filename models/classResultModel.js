const mongoose = require('mongoose');

const classResultSchema = new mongoose.Schema({
    level: {type: String}, 
    department: {type: String},
    students: [{type: mongoose.Schema.Types.ObjectId}],
    courses: [{type: mongoose.Schema.Types.ObjectId}],
    testScores: [{type: Number}],
    examScores: [{type: Number}],
    grades: [{type: String}]
})

module.exports = mongoose.model('ClassResult', classResultSchema);