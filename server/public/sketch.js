let noiseOffsetX = 0;
let noiseOffsetY = 0;
let speed = 0;
let maxAcceleration = 0.004;
let currentAcceleration = 0;
let noiseScale = 0.002;
let angle = 0;

let speed_x = 0;
let speed_y = 0;

let particles = [];
let otherShips = {};

let lastBulletFired = 0;
let bullets = [];

const START_SHIELD = 1;
const CRASH_START = 2;
const CRASH_GOING_ON = 3;

let game_state = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);
    noiseSeed(1);
    restartAtStart();
}

window.otherBullet = function otherBullet(data) {
   bullets.push(data);
}

window.otherBulletClear = function otherBulletClear(data) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        // Compute the noise value.
        if(bullets.id == data.id) {
            bullets.splice(i, 1);
        }
    }
}

window.clearOtherShip = function clearOtherShip(id) {
    delete otherShips.id;
}

window.otherShip = function otherShip(data) {
   otherShips[data.id] = data;
}

window.otherParticles = function otherParticles(data) {

    for (let i = 0; i < data.length; i++) {
        let d = data[i];
        d.x  += ((d.noiseOffsetX - noiseOffsetX) * 500);
        d.y += ((d.noiseOffsetY - noiseOffsetY) * 500);
        
        particles.push(d);
    }
}

// Function to calculate the distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Function to check if a point is inside a circle
function pointInCircle(px, py, cx, cy, r) {
    return distance(px, py, cx, cy) <= r;
}

// Function to check if a line segment intersects a circle
function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    // Check if either endpoint is inside the circle
    if (pointInCircle(x1, y1, cx, cy, r) || pointInCircle(x2, y2, cx, cy, r)) {
        return true;
    }

    // Calculate the distance from the circle's center to the line segment
    let dx = x2 - x1;
    let dy = y2 - y1;
    let fx = x1 - cx;
    let fy = y1 - cy;

    let a = dx * dx + dy * dy;
    let b = 2 * (fx * dx + fy * dy);
    let c = (fx * fx + fy * fy) - r * r;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return false; // No intersection
    }

    discriminant = Math.sqrt(discriminant);

    let t1 = (-b - discriminant) / (2 * a);
    let t2 = (-b + discriminant) / (2 * a);

    if (t1 >= 0 && t1 <= 1 || t2 >= 0 && t2 <= 1) {
        return true; // Intersection
    }

    return false; // No intersection
}

// Function to check for collision between the ship and the circle
function crashDetection(shipCoordinates, circleX, circleY, radius) {
    // Check if any of the triangle's vertices are inside the circle
    for (let vertex of shipCoordinates) {
        if (pointInCircle(vertex.x, vertex.y, circleX, circleY, radius)) {
            return true;
        }
    }

    // Check if any of the triangle's edges intersect the circle
    for (let i = 0; i < shipCoordinates.length; i++) {
        let start = shipCoordinates[i];
        let end = shipCoordinates[(i + 1) % shipCoordinates.length];
        if (lineIntersectsCircle(start.x, start.y, end.x, end.y, circleX, circleY, radius)) {
            return true;
        }
    }

    return false; // No collision detected
}

function draw_background(shipCoordinates) {

    // Iterate from top to bottom.
    for (let y = 0; y < height; y += 10) {
        // Iterate from left to right.
        for (let x = 0; x < width; x += 10) {
            // Scale the input coordinates.
            let nx = (noiseScale * x) + noiseOffsetX;
            let ny = (noiseScale * y) + noiseOffsetY;

            // Compute the noise value.
            if (noise(nx, ny) > 0.5) {
                stroke(1);
                if(x > (width / 2 - 30) && x < (width / 2 + 30) && y > (height / 2 - 30) && y < (height / 2) + 30) {
                    if(!game_state && crashDetection(shipCoordinates, x, y, 5)) {
                        game_state = CRASH_START;
                    }
                }

                circle(x, y, 5);

                
            }
        }
    }
}

function maybeFireBullet() {
    let now = Date.now();

    if(lastBulletFired + 300 > now) {
        return;
    }
    lastBulletFired = now;

    let offset = createVector(0,-22); // Offset for the tip of ship.
    offset.rotate(angle); // Rotate the offset vector based on the ship's angle

    let bullet = {
        x: width / 2 + offset.x, // Start at the center of the screen with offset
        y: height / 2 + offset.y, // Below the ship with offset
        x_speed: speed_x * 500 + (maxAcceleration * 6 * 500 * cos(angle - PI / 2)),
        y_speed: speed_y * 500 + (maxAcceleration * 6 * 500 * sin(angle - PI / 2)),
        noiseOffsetX: noiseOffsetX,
        noiseOffsetY: noiseOffsetY,
        id: nick+now
    }
    bullets.push(bullet);
    sendBulletUpdate(bullet);
}

function addParticles() {
    let newParticles = [];
    for (let i = 0; i < 2; i++) {
        let offset = createVector(-10 + random(20), 17); // Offset for the particles below the ship
        offset.rotate(angle); // Rotate the offset vector based on the ship's angle

        let angelToUse = angle + ( (10 - random(0, 20) ) / (2.0 * PI));

        let particle = {
            x: width / 2 + offset.x, // Start at the center of the screen with offset
            y: height / 2 + offset.y, // Below the ship with offset
            x_speed: speed_x - (currentAcceleration * 500 * cos(angelToUse - PI / 2)),
            y_speed: speed_y - (currentAcceleration * 500 * sin(angelToUse - PI / 2)),
            time_to_live: 70, // Initial alpha value for fading out
            noiseOffsetX: noiseOffsetX,
            noiseOffsetY: noiseOffsetY,
            

        };
        newParticles.push(particle);
        particles.push(particle);    
    }

    sendParticleUpdate(newParticles);
}

function drawBullets(shipCoordinates) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        bullet.x += bullet.x_speed;
        bullet.y += bullet.y_speed;

        let nx = (noiseScale * bullet.x) + bullet.noiseOffsetX;
        let ny = (noiseScale * bullet.y) + bullet.noiseOffsetY;

        // Compute the noise value.
        if (noise(nx, ny) > 0.5) {
            bullets.splice(i, 1);
            sendBulletClear(bullet);
            continue; 
        }

        const x = bullet.x + (bullet.noiseOffsetX - noiseOffsetX) * 500;
        const y = bullet.y + (bullet.noiseOffsetY - noiseOffsetY) * 500;

        if(x > (width / 2 - 30) && x < (width / 2 + 30) && y > (height / 2 - 30) && y < (height / 2) + 30) {
            if(!game_state && crashDetection(shipCoordinates, x, y, 2)) {
                game_state = CRASH_START;
                bullets.splice(i, 1);
                continue; 
            }
        }

        fill(color(1));
        noStroke();
        square(x, y, 4);

    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        particle.x += particle.x_speed - (speed_x * 500);
        particle.y += particle.y_speed - (speed_y * 500);
        particle.time_to_live -= 1; // Decrease alpha value

        // Draw the particle

        fill(color(255 - (particle.time_to_live * 2)));
        noStroke();
        circle(particle.x, particle.y, 3);

        // Remove particle if its alpha is below zero
        if (particle.time_to_live <= 0) {
            particles.splice(i, 1);
        }
    }
    
    fill(255);
}

function drawOtherShips() {

    Object.values(otherShips).forEach(value => {
        const rel_x = (value.x - noiseOffsetX) * 500;
        const rel_y = (value.y - noiseOffsetY) * 500;

        const shipX = value.w + rel_x;
        const shipY = value.h + rel_y;

        drawOneShip(shipX, shipY, value.direction, 1);

    });
}

function drawShip() {
    // Set the ship's position to the center of the screen
    const shipX = width / 2;
    const shipY = height / 2;

    // Save the current state of the canvas
    let transform = drawOneShip(shipX, shipY, angle, 1);

    let x_0 = transform['e'];
    let y_0 = transform['f'];
    let x_1 = transform['a'] + transform['e'];
    let y_1 = transform['b'] + transform['f'];
    let media_per_unit = dist(x_0,y_0, x_1, y_1);

    return [{
        x: ((transform.a * 0 + transform.c * -20 + transform.e) / media_per_unit) ,
        y: ((transform.b * 0 + transform.d * -20 + transform.f) / media_per_unit) 
    },{
        x: ((transform.a * -15 + transform.c * 15 + transform.e) / media_per_unit),
        y: ((transform.b * -15 + transform.d * 15 + transform.f) / media_per_unit)
    },
    {
        x: ((transform.a * 15 + transform.c * 15 + transform.e) / media_per_unit) ,
        y: ((transform.b * 15 + transform.d * 15 + transform.f) / media_per_unit) 
    }];
}

function drawOneShip(shipX, shipY, shipAngle, col) {
    push();

    stroke(col);
    if (game_state == START_SHIELD) {
        fill("green");
        circle(shipX, shipY, 53);
    }

    // Translate to the ship's position
    translate(shipX, shipY);

    // Rotate the ship based on the angle variable
    rotate(shipAngle);

    // Draw the triangular ship pointing upwards
    fill(255); // White color for the ship
    beginShape();

    vertex(0, -20); // Tip of the triangle pointing upwards
    vertex(-15, 15); // Bottom left corner
    vertex(15, 15); // Bottom right corner
    endShape(CLOSE);

    let transform = drawingContext.getTransform();
    // Restore the previous state of the canvas    
    pop();
    return transform;
}

function makeShipExplosion() {
    let newParticles = [];
    for(let i = 0; i < 200; i++) {
        let angelToUse = random(1,360);

        let p = {
            x: (width / 2) - 5 + random(1, 10), 
            y: (height / 2) - 5 + random(1, 10), 
            x_speed: random(1,10) * cos(angelToUse - PI / 2),
            y_speed: random(1,10) * sin(angelToUse - PI / 2),
            time_to_live: 30+random(1, 20)
        }
        particles.push(p);
        newParticles.push(p);
    }
    sendParticleUpdate(newParticles);
 }

function gameOn() {
    game_state = 0;
}

 function restartAtStart() {
    noiseOffsetX = 0;
    noiseOffsetY = 0;
    game_state = START_SHIELD;
    angle = 0;
    speed_x = 0;
    speed_y = 0;

    setTimeout(gameOn, 5000);
 }

function draw() {
    clear();

    drawOtherShips();
    drawParticles();

    if(game_state == CRASH_START) {
        game_state = CRASH_GOING_ON;
        angle = 0;
        speed_x = 0;
        speed_y = 0;
        makeShipExplosion();
        setTimeout(restartAtStart, 4000);
    } 

    if(game_state == CRASH_GOING_ON) {
        draw_background([]);
        drawBullets([]);
        return;
    } else {
        sendLocationUpdate(noiseOffsetX, noiseOffsetY, angle, width / 2, height / 2);

        let shipCoordinates = drawShip();

        draw_background(shipCoordinates);
        drawBullets(shipCoordinates);
    }

    

    // Update the position based on the current speed and angle
    noiseOffsetX += speed_x;
    noiseOffsetY += speed_y; 

    if(keyIsDown(RIGHT_ARROW)) {
        angle += 0.25;
    }
    if(keyIsDown(LEFT_ARROW)) {
        angle -= 0.25;
    }

    /* z key */
    if(keyIsDown(90)) {
        maybeFireBullet();
    }

    if(keyIsDown(UP_ARROW)) {
        currentAcceleration += maxAcceleration / 30;
        if(currentAcceleration > maxAcceleration) {
            currentAcceleration = maxAcceleration;
        }

        addParticles();

        speed_x += currentAcceleration * cos(angle-(3.14/2));
        speed_y += currentAcceleration * sin(angle-(3.14/2));;
    }

    /* Gravity */
    speed_y += 0.0001;

    /* Air resistance */
    speed_x -= (speed_x / 20);
    speed_y -= (speed_y / 20);
}

