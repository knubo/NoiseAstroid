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

app.use(express.static('public'))

// Enable CORS for all routes
app.use(cors());

// Serve the static files from the public directory
app.use(express.static('public'));

let activePlayers = {}

io.on('connection', (socket) => {
    console.log('A user connected with '+socket.id);

    server.on('nick', (data) => {
        activePlayers[socket.id] = nick;
        socket.broadcast.emit("newPlayer", {"id":socket.id, "nick":nick});
    });

    // Listen for location updates from clients
    socket.on('locationUpdate', (data) => {
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('locationUpdate', data);
    });

    // Listen for particles clients
    socket.on('particlesUpdate', (data) => {
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('particlesUpdate', data);
    });

    socket.on('bulletUpdate', (data) => {
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('bulletUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected with id '+socket.id);
        delete activePlayers[socket.id];
        socket.broadcast.emit("playerLeft", {"id":socket.id, "nick":nick});

    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});