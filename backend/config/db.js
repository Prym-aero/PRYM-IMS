const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        // Database connected successfully
    })
    .catch((err) => {
        console.error("Error connecting to the database:", err);
        process.exit();
    })

module.exports = mongoose;