const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    product_model: {
        type: String,
        default: ""
    },
    product_description: {
        type: String,
        default: ""
    },
    product_image: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        enum: ['general', 'mechanical', 'electrical'],
        default: 'general'
    },
    parts: [
        {
            part_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Part',
                required: true
            },
            part_name: {
                type: String,
                default: "",
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            }
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Product", productSchema);
