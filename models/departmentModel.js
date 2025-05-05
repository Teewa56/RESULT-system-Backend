const mongoose = requie('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {type: String, unique: true},
    courses: [{type: mongoose.Schema.Types.ObjectId}],
    abbr: {type: String},
    levels: [{type: mongoose.Schema.Types.ObjectId}],
    lecturers: [{type: mongoose.Schema.Types.ObjectId}],
})

module.exports = mongoose.model('Department', departmentSchema);