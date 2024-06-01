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

    console.log("Enemy count:" +Object.keys(pawned).length);

    let pos = 0;
    for(i in spawned) {
        let sobj = spawned[i];

        if(sobj.alive == 0) {
            continue;
        }
        pos++;

        if((roundCount % pos) < 2) {
            const angle = Math.floor(p5Instance.random(0,3)) * 90;

            let bullet = {
                x: 0,
                y: 0,
                x_speed: (0.004 * 3 * 500 * Math.cos( angle * (p5Instance.PI / 180) )),
                y_speed: (0.004 * 3 * 500 * Math.sin( angle * (p5Instance.PI / 180) )),
                noiseOffsetX: sobj.x,
                noiseOffsetY: sobj.y,
                alive: 1
            }
            io.emit('bulletUpdate', bullet);
        }
    }
}

function reportSpawned(socket) {
    for(let i in spawned) {
        let sobj = spawned[i];
        console.log("Sending on connect.")
        socket.emit('spawn', { message: sobj, id: socket.id });
    }    
}

function spawn(socket, x, y) {

    for(let a in locs) {
        let i = locs[a] + x;

        for(let b in locs) {
            let j = locs[b] + y;

            let value = p5Instance.noise( i,  j);

            if(value < 0.401) {
                const spawnId = Math.floor( i * 3) + "#" + Math.floor(j * 3);
                
                if(spawned[spawnId]) {
                    continue;
                }

                let sobj = {"x": i, "y": j, id: spawnId};

                spawned[spawnId] = sobj;
                //console.log("Spawning id is:"+spawnId + "sobj: "+JSON.stringify(sobj)+" x is : "+x+" y is:"+y+" i is: "+i+" j is: "+j);
                socket.emit('spawn', sobj);
            }
            
        }
    }
}


module.exports = {
    spawn,reportSpawned,shoot
};