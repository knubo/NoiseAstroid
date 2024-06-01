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

                let sobj = {"x": i, "y": j};

                spawned[spawnId] = sobj;
                console.log("Spawning id is:"+spawnId + "sobj: "+JSON.stringify(sobj)+" x is : "+x+" y is:"+y+" i is: "+i+" j is: "+j);
                socket.emit('spawn', sobj);
            }
            
        }
    }
}


module.exports = {
    spawn,reportSpawned
};