const mongoose = require('mongoose');

const productPartSchema = new mongoose.Schema({
    organization: {
        type: String,
        default: 'PRYM Aerospace'
    },
    part_name: {
        type: String,
        required: true,
    },
    part_number: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});


module.exports = mongoose.model('Part', productPartSchema);