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
    inventory: {
        type: [
            {
                id: {
                    type: String,
                    required: true,
                },
                part_name: {
                    type: String,
                    required: true,
                },
                part_number: {
                    type: String,
                    required: true,
                },
                status: {
                    type: String,
                    default: "in-stock"
                },
                date: {
                    type: Date,
                }
            }
        ],
        default: []
    },
    date: {
        type: Date,
        default: Date.now,
    }
});


module.exports = mongoose.model('Part', productPartSchema);