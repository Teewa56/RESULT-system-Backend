const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    level: {type: string},
    department: {type: mongoose.Schema.Types.ObjectId},
    courses: [{type: mongoose.Schema.Types.ObjectId}],
    classResults: [{type: mongoose.Schema.Types.ObjectId}]
})

module.exports = mongoose.model('Level', levelSchema);