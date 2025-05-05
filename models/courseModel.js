const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {type: string},
    courseUnits: {type: number},
    level: {type: mongoose.Schema.Types.ObjectId},
    registeredStudents: [{type: mongoose.Schema.Types.ObjectId}],
    lecturer: {type: mongoose.Schema.Types.ObjectId},
    result: {type: mongoose.Schema.Types.ObjectId}
})

module.exports = mongoose.model('Course', courseSchema);