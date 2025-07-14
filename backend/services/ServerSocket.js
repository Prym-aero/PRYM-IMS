// ServerSocket.js
const { Server } = require('socket.io');

const tempData = [];

exports.ServerSocket = async (server) => {
    try {
        const io = new Server(server, {
            cors: {
                origin: ["https://prym-ims.vercel.app", "http://localhost:5173", "http://localhost:5174"],
                methods: ["GET", "POST"]
            }
        });

        // Listen for new socket connections
        io.on('connection', (socket) => {
            console.log('✅ New client connected:', socket.id);

            socket.emit('initial-scan', tempData);

            // Listen for scanned QR data
            socket.on('qr-scan', (data) => {
                console.log('📦 Received QR Code Data:', data);
                tempData.push(data);
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
