const Product = require('../models/product');

exports.addProduct = async (req, res) => {
    try {
        const { product_name, parts } = req.body;

        if (!product_name || !Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ message: "Missing required product data." });
        }

        const exists = await Product.findOne({ product_name });
        if (exists) {
            return res.status(409).json({ message: "Product already exists." });
        }

        const newProduct = new Product({ product_name, parts });
        await newProduct.save();

        res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ message: "Internal Server Error", error: err });
    }
};

exports.getProcuts = async (req, res) => {
    try {
        const products = await Product.find();

        if (products.length < 1) {
            return res.status(404).json({ message: "there are no procuts " });
        }

        res.status(200).json({ message: "products fetch successfully", products });

    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Internal server error", err });
    }
}