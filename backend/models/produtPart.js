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
                serialPartNumber: {
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
    },
    part_description: {
        type: String,
        default: "",
    },
    lastSerialNumber: {
        type: Number,
        default: 0,
    },
    image: {
        type: String,
        default: "",
    },
    images: {
        type: [String],
        default: []
    },
    // New fields for additional part information
    material: {
        type: String,
        default: ""
    },
    weight: {
        type: String,
        default: ""
    },
    cadModel: {
        type: String,
        default: ""
    },
    manufacturer: {
        type: String,
        default: ""
    },
    grade: {
        type: String,
        default: ""
    },
    dimensions: {
        type: String,
        default: ""
    },
    // New QC fields
    part_model: {
        type: String,
        default: ""
    },
    part_weight: {
        type: String,
        default: ""
    },
    part_serial_prefix: {
        type: String,
        default: ""
    },
    part_image: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        enum: ['mechanical', 'electrical', 'general'],
        default: 'mechanical'
    },
    technical_specifications: {
        type: [
            {
                property: {
                    type: String,
                    required: true
                },
                answer: {
                    type: String,
                    required: true
                }
            }
        ],
        default: []
    }
});


module.exports = mongoose.model('Part', productPartSchema);