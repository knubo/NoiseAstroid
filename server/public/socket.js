const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const nick = urlParams.get('nick');
let server_address = urlParams.get('server');

let socket = 0;
if(nick) {
    if(server_address) {
        socket = io('http://'+server_address+':3000');
    } else {
        socket = io('/');
    }
   
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


window.sendLocationUpdate = function sendLocationUpdate(x, y, direction, w, h) {
    if(!nick) {
        return;
    }

    socket.emit('locationUpdate', {"x":x, "y":y, "direction":direction, "w":w, "h":h});
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
    
    socket.on('newPlayer', (data) => {
        Swal.fire({
            title: 'New player',
            text: 'Player '+data+" has joined the game!",
            icon: 'success',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
    });

    socket.emit('nick', nick, (response) => {
        console.log(response.status); // ok);
    });

}

