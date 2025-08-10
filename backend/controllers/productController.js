const Product = require('../models/product');

exports.addProduct = async (req, res) => {
    try {
        const {
            product_name,
            product_model,
            product_description,
            product_image,
            category,
            parts
        } = req.body;

        console.log("Received product data:", req.body);

        if (!product_name) {
            return res.status(400).json({ message: "Product name is required." });
        }

        const exists = await Product.findOne({ product_name });
        if (exists) {
            return res.status(409).json({ message: "Product already exists." });
        }

        const newProduct = new Product({
            product_name,
            product_model: product_model || '',
            product_description: product_description || '',
            product_image: product_image || '',
            category: category || 'general',
            parts: parts || []
        });
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

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const product = await Product.findById(id).populate('parts.part_id');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({
            message: "Product fetched successfully",
            product
        });

    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).json({ message: "Internal server error", err });
    }
}

// Update product information
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            product_name,
            product_model,
            product_description,
            product_image,
            parts
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if user has permission to edit (24-hour rule)
        if (req.user && req.user.role !== 'admin') {
            const createdAt = product.createdAt;
            const now = new Date();
            const hoursSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60);

            if (hoursSinceCreation > 24) {
                return res.status(403).json({
                    message: "Edit not allowed. Products can only be edited within 24 hours of creation. Contact admin for changes.",
                    canEdit: false,
                    hoursSinceCreation: Math.round(hoursSinceCreation)
                });
            }
        }

        // Update product fields
        if (product_name !== undefined) product.product_name = product_name;
        if (product_model !== undefined) product.product_model = product_model;
        if (product_description !== undefined) product.product_description = product_description;
        if (product_image !== undefined) product.product_image = product_image;
        if (parts !== undefined) product.parts = parts;

        await product.save();

        res.status(200).json({
            message: "Product updated successfully",
            product
        });

    } catch (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ message: "Internal server error", err });
    }
}

// Check if user can edit product
exports.checkProductEditPermission = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let canEdit = true;
        let message = "Edit allowed";
        let hoursSinceCreation = 0;

        // Check if user has permission to edit (24-hour rule)
        if (req.user && req.user.role !== 'admin') {
            const createdAt = product.createdAt;
            const now = new Date();
            hoursSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60);

            if (hoursSinceCreation > 24) {
                canEdit = false;
                message = "Edit not allowed. Products can only be edited within 24 hours of creation. Contact admin for changes.";
            }
        }

        res.status(200).json({
            canEdit,
            message,
            hoursSinceCreation: Math.round(hoursSinceCreation),
            isAdmin: req.user?.role === 'admin'
        });

    } catch (err) {
        console.error("Error checking edit permission:", err);
        res.status(500).json({ message: "Internal server error", err });
    }
}