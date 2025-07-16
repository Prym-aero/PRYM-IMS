// seedUsers.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require('dotenv').config();
const User = require("./models/user"); // Adjust path to your User model



const seedUsers = async () => {
    try {
        const MONGO_URL = process.env.MONGO_URL;
        await mongoose.connect("mongodb+srv://softwareprymaerospace:3So7Gn5TKOBaoiWG@erp-cluster.4bgolik.mongodb.net/ERP-DB?retryWrites=true&w=majority&appName=ERP-Cluster");

        // Clear existing users (optional)
        await User.deleteMany();

        // Define users to create
        const users = [
            {
                name: "Admin User",
                email: "admin@prymaerospace.com",
                password: "admin@prym1234", // You can change it
                role: "admin",
            },
            {
                name: "Adder User",
                email: "adder@prymaerospace.com",
                password: "adder@prym1234",
                role: "adder",
            },
            {
                name: "Scanner User",
                email: "scanning@prymaerospace.com",
                password: "scanner@prym1234",
                role: "scanner",
            },
            {
                name: "Inventory User",
                email: "inventory@prymaerospace.com",
                password: "inventory@prym1234",
                role: "inventory",
            },
        ];

        // Hash passwords and save users
        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
            });
            await user.save();
        }

        console.log("✅ Users seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Failed to seed users:", error);
        process.exit(1);
    }
};

seedUsers();
