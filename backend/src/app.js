const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { initSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Real-time Sockets
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to RepairNow API' });
});

// Import Routes
const authRoutes = require('./routes/auth');
const repairRoutes = require('./routes/repairs');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
