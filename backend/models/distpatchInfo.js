const mongoose = require('mongoose');

const disptachSchema = new mongoose.Schema({
    allotment_no: {
        type: String,
        required: true,
    },
    pdfUrl: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
},
    { timestamps: true }
);

module.exports = mongoose.model('Dispatch', disptachSchema);