const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = async (req, res, next) => {
     try {
          const authHeader = req.headers.authorization;

          if (!authHeader || !authHeader.startsWith("Bearer ")) {
               return res.status(401).json({ message: "Unauthorized: No token provided" });
          }

          const token = authHeader.split(" ")[1];

          const decoded = jwt.verify(token, JWT_SECRET);

          // Get user details including role
          const user = await User.findById(decoded.id).select("-password");
          if (!user) {
               return res.status(401).json({ message: "Unauthorized: User not found" });
          }

          req.user = { id: user._id, role: user.role, email: user.email, name: user.name };
          next();
     } catch (err) {
          // console.error("Auth middleware error:", err.message);
          res.status(401).json({ message: "Unauthorized: Invalid token" });
     }
};

const authKey = (req, res, next) => {
     try {
          const apiKey = req.headers['x-api-key'];
          const secretKey = req.headers['x-secret-key'];

          if (apiKey !== process.env.AUTH_API_KEY || secretKey !== process.env.AUTH_SECRET_KEY) {
               return res.status(403).json({ message: "Forbidden: Invalid API key or secret key" });
          }

          next();

     } catch (error) {
          console.error("Auth key error:", error.message);
          res.status(500).json({ message: "Internal Server Error" });
     }
}

module.exports = { authMiddleware, authKey };
