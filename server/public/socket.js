const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const nick = urlParams.get('nick');
let server_address = urlParams.get('server');

if(!server_address) {
    server_address = "localhost";
}


let socket = 0;
if(nick) {
   socket = io('http://'+server_address+':3000');
}

window.sendParticleUpdate = function sendParticleUpdate(particles) {
    if(!nick) {
        return;
    }
    socket.emit('particlesUpdate', particles);
}

window.sendBulletUpdate = function sendBulletUpdate(particles) {
    if(!nick) {
        return;
    }
    socket.emit('bulletUpdate', particles);
}


window.sendLocationUpdate = function sendLocationUpdate(x, y, direction) {
    if(!nick) {
        return;
    }

    socket.emit('locationUpdate', {"x":x, "y":y, "direction":direction, "nick":nick});
}

if(socket) {
    socket.on('locationUpdate', (data) => {
        otherShip(data);
    });
    socket.on('particlesUpdate', (data)  => {
        otherParticles(data);
    });   
    socket.on('bulletUpdate', (data)  => {
        otherBullet(data);
    });    
}

