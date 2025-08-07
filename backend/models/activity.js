const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    actionUser: {
        type: String,
        required: true,

    },
    date: {
        type: Date,
        default: Data.now,
    },
    operation: {
        type: String,
        required: true,
        enum: ['add', 'dispatch', 'update', 'remove', 'generate', 'scan'],
    }
})