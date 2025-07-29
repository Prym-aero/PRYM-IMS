const mongoose = require('mongoose');

const QRSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: "PRYM-QR"
    },
    description: {
        type: String,
        required: true,
        trim: true,
        default: "QR Code for PRYM-IMS"
    },
    scannedCount: {
        type: Number,
        required: true,
        default: 0,
    },
    generatedCount: {
        type: Number,
        required: true,
        default: 0,
    },
    qrId: {
        type: [String],
        default: [],
        required: true,
    },

},
    {
        timestamps: true,
    });


const QR = mongoose.model('QR', QRSchema);

module.exports = QR;