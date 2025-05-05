require('dotenv').config();
const mongoose = require('mongoose');
const URL = process.env.MONGO_URL;

const connectDb = async() => {
    try {
        await mongoose.connect(URL);
        console.log('DB connected sucesfully')
    } catch (error) {
        console.log(`Error: ${error}`);
        process.exit(1);
    }
}

module.exports = connectDb;