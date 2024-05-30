const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity, adjust as needed
        methods: ['GET', 'POST']
    }
});

// Enable CORS for all routes
app.use(cors());

// Serve the static files from the public directory
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for location updates from clients
    socket.on('locationUpdate', (data) => {
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('locationUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
