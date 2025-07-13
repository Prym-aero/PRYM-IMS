// ServerSocket.js
const { Server } = require('socket.io');

exports.ServerSocket = async (server) => {
    try {
        const io = new Server(server, {
            cors: {
                origin: ["http://localhost:5173", "http://localhost:3000"],
                methods: ["GET", "POST"]
            }
        });

        // Listen for new socket connections
        io.on('connection', (socket) => {
            console.log('✅ New client connected:', socket.id);

            // Listen for scanned QR data
            socket.on('qr-scan', (data) => {
                console.log('📦 Received QR Code Data:', data);

                // Broadcast it to all connected clients
                io.emit('qr-received', data);
            });

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });
        });

    } catch (err) {
        console.error("❌ Socket.IO Setup Error:", err.message);
    }
};
