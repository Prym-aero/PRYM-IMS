const User = require('../models/user');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // assuming you attach `req.user` via auth middleware
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user" });
    }
}

exports.registerController = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'admin' // Default to admin role
        });

        await newUser.save();

        // Generate JWT
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ message: "Server error during registration" });
    }
};

exports.loginController = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Generate JWT
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

        // 4. Return user info and token (you can filter user fields as needed)
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role, // if you have roles
            },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "Server error during login" });
    }
};