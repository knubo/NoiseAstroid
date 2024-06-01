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

window.sendBulletUpdate = function sendBulletUpdate(bullet) {
    if(!nick) {
        return;
    }
    socket.emit('bulletUpdate', bullet);
}

window.sendBulletClear = function sendBulletClear(bullet) {
    if(!nick) {
        return;
    }
    socket.emit('bulletClear', bullet);
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
    socket.on('bulletClear', (data)  => {
        otherBulletClear(data);
    });
    
    socket.on('newPlayer', (data) => {
        Swal.fire({
            title: 'New player',
            text: 'Player '+data.nick+" has joined the game!",
            icon: 'success',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          console.log("Id: "+data.id);
          updatePlayerScore(data.id, data.nick, 0);
    });

    socket.on('playerLeft', (data) => {
        Swal.fire({
            title: 'Bye bye player',
            text: 'Player '+data.nick+" has left the game!",
            icon: 'error',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          clearOtherShip(data.id);
          clearScore(data.id);
    });

    socket.on('sendNick', (data, callback) => {
        updatePlayerScore(socket.id, nick, 0);
        callback({status: "ok", nick: nick});
    });


}

