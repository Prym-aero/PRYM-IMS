const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("ERP database connected successfully");
    })
    .catch((err) => {
        console.log("errro in connnecting to the database", err);
        process.exit();
    })

module.exports = mongoose;