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

module.exports = authMiddleware;
