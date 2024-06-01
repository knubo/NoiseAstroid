const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const { spawn,reportSpawned } = require('./enemies');

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

    // Listen for location updates from clients
    socket.on('locationUpdate', (data) => {
        data.id = socket.id;

        spawn(socket, data.x, data.y);

        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('locationUpdate', data);
    });

    // Listen for location updates from clients
    socket.on('scoreUpdate', (data) => {
        data.id = socket.id;

        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('scoreUpdate', data);
    });

    // Listen for particles clients
    socket.on('particlesUpdate', (data) => {

        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('particlesUpdate', data);
    });

    socket.on('bulletUpdate', (data) => {
        data.id = socket.id;
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('bulletUpdate', data);
    });

    socket.on('bulletClear', (data) => {
        data.id = socket.id;
        // Broadcast the location update to all other connected clients
        socket.broadcast.emit('bulletClear', data);
    });


    socket.on('disconnect', () => {
        console.log('A user disconnected with id '+socket.id);
        socket.broadcast.emit("playerLeft", {"id":socket.id, "nick":activePlayers[socket.id]});
        delete activePlayers[socket.id];
    });

    console.log("Sending request sendNick to " + socket.id);
    socket.emit('sendNick', { message: '', id: socket.id }, (response) => {
        console.log("Nick for "+socket.id+" is now "+response.nick);
        activePlayers[socket.id] = response.nick;
        socket.broadcast.emit("newPlayer", {"id":socket.id, "nick":response.nick});
        reportSpawned(socket);
    });

    
    

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
