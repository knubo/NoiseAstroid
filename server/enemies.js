const p5 = require('node-p5');

let spawned = {}

function sketch(p) {
    p.setup = () => {
        p.createCanvas(200, 200);
    }
}
const locs = [-1.535, -1.53, -1.525, -1.520, 1.52, 1.525, 1.53, 1.535];

let p5Instance = p5.createSketch(sketch);
p5Instance.noiseSeed(1);

let roundCount = 0;

function shoot(io) {
    roundCount++;

    console.log("Enemy count:" + Object.keys(spawned).length);

    for (i in spawned) {
        let sobj = spawned[i];

        if (sobj.alive == 0) {
            continue;
        }
        if (p5Instance.random(1, 10) > 5) {
            continue;
        }

        let angle = 0;

        switch (sobj.type) {
            case 2:
                sobj.angle += 10;
                angle = sobj.angle;
                break;
            case 3:
                angle = (Math.floor(p5Instance.random(0, 4)) * 90) + 45;
                break;
            case 4:
                break;
            default:
                angle = Math.floor(p5Instance.random(0, 4)) * 90;
        }

        switch (sobj.type) {
            case 3:
                let bullet = makeBullet(angle, sobj);
                io.emit('bulletUpdate', bullet);

                bullet.x = bullet.x_speed * 5;
                bullet.y = bullet.y_speed * 5;
                io.emit('bulletUpdate', bullet);

                bullet.x = -bullet.x;
                bullet.y = -bullet.y;
                io.emit('bulletUpdate', bullet);
                break;
            case 4:
                break;
            default:
                io.emit('bulletUpdate', makeBullet(angle, sobj));

        }

    }
}

function makeBullet(angle, sobj) {
    return {
        x: 0,
        y: 0,
        x_speed: (0.004 * 3 * 500 * Math.cos(angle * (p5Instance.PI / 180))),
        y_speed: (0.004 * 3 * 500 * Math.sin(angle * (p5Instance.PI / 180))),
        noiseOffsetX: sobj.x,
        noiseOffsetY: sobj.y,
        spawn: sobj,
        type: sobj.type
    };
}

function clearSpawn(spawn) {
    spawned[spawn.id].alive = 0;
}

function reportSpawned(socket) {
    socket.emit('spawned', spawned);
}

function spawn(socket, x, y) {
    for (let a in locs) {
        let i = locs[a] + x;

        for (let b in locs) {
            let j = locs[b] + y;

            let value = p5Instance.noise(i, j);

            if (value < 0.401) {
                const spawnId = Math.floor(i) + "#" + Math.floor(j);

                if (spawned[spawnId]) {
                    continue;
                }

                let sobj = { "x": i, "y": j, angle: 0, id: spawnId, "alive": 1, "type": pickEnemyType(value) };

                spawned[spawnId] = sobj;
                //console.log("Spawning id is:"+spawnId + "sobj: "+JSON.stringify(sobj)+" x is : "+x+" y is:"+y+" i is: "+i+" j is: "+j);
                socket.emit('spawn', sobj);
            }

        }
    }
}


module.exports = {
    spawn, reportSpawned, shoot, clearSpawn
};

function pickEnemyType(value) {

    let check = Math.floor(value * 1000) % 10;

    if(check == 9) {
        return 4;
    }

    return Math.floor(value * 1000) % 4;
}
