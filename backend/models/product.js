const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    parts: [
        {
            part_name: {
                type: String,
                required: true,
                trim: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            category: {
                type: String,
                required: true,
            },
            categoryName: {
                type: String,
                required: true,
            }
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Product", productSchema);
