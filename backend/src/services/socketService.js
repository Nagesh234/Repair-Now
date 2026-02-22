const socketIo = require('socket.io');

let io;

exports.initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Adjust for production security if needed
            methods: ["GET", "POST", "PATCH", "PUT"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // A client (Partner or Customer) joins a specific repair room
        socket.on('join_repair_room', (repairId) => {
            if (repairId) {
                socket.join(`repair_${repairId}`);
                console.log(`[Socket] Client ${socket.id} joined room: repair_${repairId}`);
            }
        });

        // Partner emits their location
        socket.on('location_update', (data) => {
            const { repairId, latitude, longitude } = data;
            if (repairId && latitude && longitude) {
                // Broadcast the location to everyone in the repair's room (e.g., the Customer)
                io.to(`repair_${repairId}`).emit('technician_location', {
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

exports.getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
