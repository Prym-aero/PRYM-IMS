const jwt = require('jsonwebtoken');
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

          req.user = { id: decoded.id }; // 👈 Attach user ID to req.user.id
          next();
     } catch (err) {
          console.error("Auth middleware error:", err.message);
          res.status(401).json({ message: "Unauthorized: Invalid token" });
     }
};

module.exports = authMiddleware;
