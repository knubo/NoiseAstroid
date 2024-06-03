let noiseOffsetX = 0;
let noiseOffsetY = 0;
let speed = 0;
let maxAcceleration = 0.004;
let currentAcceleration = 0;
let noiseScale = 0.002;
let angle = 0;
let angel_acceleration;
const MAX_ANGLE_ACCELERATION = 0.25;

let score = 0;

let speed_x = 0;
let speed_y = 0;

let particles = [];
let otherShips = {};

let lastBulletFired = 0;
let bullets = [];

let enemies = {};

let thrustSound;
let shootSound;
let explosionSound;
let shipExplosionSound;
let bulletSound, bulletSound2, bulletSound3;

let energy = 8000;

const START_SHIELD = 1;
const CRASH_START = 2;
const CRASH_GOING_ON = 3;

let game_state = 0;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let gameWithSound = urlParams.get('audio');


function preload() {
    if (gameWithSound) {
        thrustSound = loadSound('audio/loopingthrust-95548.mp3');
        shootSound = loadSound('audio/sci-fi-cannon-firing-whoosh-after-fire-low-pitch-slight-reverb-204400.mp3');
        explosionSound = loadSound('audio/explosion-drop-6879.mp3');
        shipExplosionSound = loadSound('audio/large-explosion-1-43636.mp3');
        bulletSound = loadSound('audio/one-shot-kickdrum-very-dirty-113410.mp3');
        bulletSound2 = loadSound('audio/hat-12-36721.mp3');
        bulletSound3 = loadSound('audio/mechrockets-36267.mp3');
        ambienSound = loadSound('audio/ambience-sounds-8-15136.mp3');
        rechargeSound = loadSound('audio/electric-sparks-6130.mp3');

        bulletSound.setVolume(0.5);
        bulletSound2.setVolume(0.5);

    }

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);
    noiseSeed(1);
    restartAtStart();

    if (gameWithSound) {
        thrustSound.setLoop(true);
        ambienSound.setLoop(true);
        ambienSound.play();
    }

}

window.otherBullet = function otherBullet(bullet) {
    bullets.push(bullet);

    const x = bullet.x + (bullet.noiseOffsetX - noiseOffsetX) * 500;
    const y = bullet.y + (bullet.noiseOffsetY - noiseOffsetY) * 500;

    /* Outside of view screen - no need to draw */
    if (x < 0 || x > width || y < 0 || y > height) {
        return;
    }

    if (gameWithSound) {
        switch (bullet.type) {
            case 2:
                bulletSound2.play();
                break;
            case 3:
                bulletSound3.play();
                break;
            default:
                bulletSound.play();
                break;
        }
    }


}

window.addEnemy = function addEnemy(data) {
    console.log("Enemy added " + JSON.stringify(data));
    enemies[data.id] = data;
}

window.setEnemies = function setEnemies(data) {
    console.log("Setting enemies");
    enemies = data;
}

window.clearEnemy = function clearEnemy(data) {
    delete enemies[data.id];
}

window.otherBulletClear = function otherBulletClear(data) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        // Compute the noise value.
        if (bullets.id == data.id) {
            bullets.splice(i, 1);
        }
    }
}

window.clearOtherShip = function clearOtherShip(id) {
    delete otherShips[id];
}

window.otherShip = function otherShip(data) {
    otherShips[data.id] = data;
}

window.otherParticles = function otherParticles(data) {

    for (let i = 0; i < data.length; i++) {
        let d = data[i];
        d.x += ((d.noiseOffsetX - noiseOffsetX) * 500);
        d.y += ((d.noiseOffsetY - noiseOffsetY) * 500);

        particles.push(d);
    }
}

function drawEnergy(amount) {
    energy -= amount;

    if (energy > 10000) {
        energy = 10000;
    }

    if (energy < 0) {
        energy = 0;
    }

    updateEnergy(energy);

    return energy != 0;
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

function drawBattery(centerX, centerY) {

    background(255, 255, 255, 0); // Transparent background

    let batteryWidth = 20;
    let batteryHeight = 40;

    // Draw the battery body
    stroke(0); // Black outline
    fill(150); // Grey fill
    rect(centerX - batteryWidth / 2, centerY - batteryHeight / 2, batteryWidth, batteryHeight);

    // Draw the battery positive terminal
    fill(0); // Black fill for the terminal
    rect(centerX - batteryWidth / 4, centerY - batteryHeight / 2 - 5, batteryWidth / 2, 5);

    // Draw the blue lightning arrow
    fill(0, 0, 255); // Blue fill
    beginShape();
    vertex(centerX - 4, centerY - 8);
    vertex(centerX + 2, centerY - 8);
    vertex(centerX - 2, centerY);
    vertex(centerX + 4, centerY);
    vertex(centerX - 2, centerY + 8);
    vertex(centerX - 2, centerY + 2);
    vertex(centerX - 8, centerY + 2);
    endShape(CLOSE);
    stroke(1);
    fill(255);
}

function rechargeCraft() {
    if (gameWithSound && !rechargeSound.isPlaying()) {
        rechargeSound.play();
        rechargeSound.setVolume(0.1);
    }

    drawEnergy(-5);

}

function draw_background(shipCoordinates) {

    // Iterate from top to bottom.
    for (let y = 0; y < height; y += 10) {
        // Iterate from left to right.
        for (let x = 0; x < width; x += 10) {
            // Scale the input coordinates.
            let nx = (noiseScale * x) + noiseOffsetX;
            let ny = (noiseScale * y) + noiseOffsetY;

            const noiseValue = noise(nx, ny);
            // Compute the noise value.
            if (noiseValue > 0.5) {
                stroke(1);
                if (x > (width / 2 - 30) && x < (width / 2 + 30) && y > (height / 2 - 30) && y < (height / 2) + 30) {
                    if (!game_state && crashDetection(shipCoordinates, x, y, 5)) {
                        game_state = CRASH_START;
                        continue;
                    }
                }

                circle(x, y, 5);
            } else {
                const xcheck = (Math.floor(noiseOffsetX * 500) + x) % 3000;
                const ycheck = (Math.floor(noiseOffsetY * 500) + y) % 3000;

                if (abs(xcheck) < 11 && abs(ycheck) < 11) {
                    drawBattery(x, y);

                    if (x > (width / 2 - 70) && x < (width / 2 + 70) && y > (height / 2 - 70) && y < (height / 2) + 70) {
                        stroke("blue");
                        line(x, y, width / 2, height / 2)
                        stroke(1);
                        rechargeCraft();
                    } else {
                        if (gameWithSound) {
                            rechargeSound.stop();
                        }
                    }
                }
            }
        }
    }
}

function maybeFireBullet() {
    let now = Date.now();

    if (lastBulletFired + 300 > now) {
        return;
    }

    if (!drawEnergy(50)) {
        return;
    }

    lastBulletFired = now;

    let offset = createVector(0, -22); // Offset for the tip of ship.
    offset.rotate(angle); // Rotate the offset vector based on the ship's angle

    let bullet = {
        x: width / 2 + offset.x, // Start at the center of the screen with offset
        y: height / 2 + offset.y, // Below the ship with offset
        x_speed: speed_x * 500 + (maxAcceleration * 6 * 500 * cos(angle - PI / 2)),
        y_speed: speed_y * 500 + (maxAcceleration * 6 * 500 * sin(angle - PI / 2)),
        noiseOffsetX: noiseOffsetX,
        noiseOffsetY: noiseOffsetY,
        id: nick + now
    }
    if (gameWithSound) {
        shootSound.play();
    }

    bullets.push(bullet);
    sendBulletUpdate(bullet);
}

function addParticles() {
    let newParticles = [];
    for (let i = 0; i < 2; i++) {
        let offset = createVector(-10 + random(20), 17); // Offset for the particles below the ship
        offset.rotate(angle); // Rotate the offset vector based on the ship's angle

        let angelToUse = angle + ((10 - random(0, 20)) / (2.0 * PI));

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

function checkIfHitEnemy(bullet) {
    for (id in enemies) {
        let enemy = enemies[id];

        if (!enemy.alive) {
            continue;
        }

        let enemyX = (enemy.x - noiseOffsetX) * 500;
        let enemyY = (enemy.y - noiseOffsetY) * 500;

        let bulletX = bullet.x;
        let bulletY = bullet.y;

        let distance = dist(bulletX, bulletY, enemyX, enemyY);

        if (distance < 20) {
            delete enemies[id]; ''
            score++;
            updateScore(score);

            sendClearEnemy(enemy);
            makeExplosion(enemyX, enemyY);
            if (gameWithSound) {
                explosionSound.play();
            }

            return 1;
        }
    }
    return 0;
}

function atCenter(x, y) {
    return x < (width / 2) + 5 && x > (width / 2) + 5 && y < (height / 2) + 5 && y > (height / 2) + 5;
}



function drawBullets(shipCoordinates) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        bullet.y_speed += 0.1;

        bullet.x += bullet.x_speed;
        bullet.y += bullet.y_speed; /* With gravity */

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

        /* Outside of view screen - no need to draw */
        if (x < 0 || x > width || y < 0 || y > height) {
            continue;
        }

        if (x > (width / 2 - 30) && x < (width / 2 + 30) && y > (height / 2 - 30) && y < (height / 2) + 30) {
            if (!game_state && crashDetection(shipCoordinates, x, y, 2) || atCenter(x, y)) {
                game_state = CRASH_START;
                bullets.splice(i, 1);
                continue;
            }
        }

        if (bullet.id && bullet.id.startsWith && bullet.id.startsWith(nick)) {
            if (checkIfHitEnemy(bullet)) {
                bullets.splice(i, 1);
                sendBulletClear(bullet);
                continue;
            }
        }

        fill(color(1));
        noStroke();
        square(x, y, 4);

    }
}

function drawEnemies() {
    for (id in enemies) {
        let enemy = enemies[id];

        if (!enemy.alive) {
            continue;
        }

        let centerX = (enemy.x - noiseOffsetX) * 500;
        let centerY = (enemy.y - noiseOffsetY) * 500;

        /* Outside of view screen - no need to draw */
        if (centerX < -20 || centerX > width + 20 || centerY < -20 || centerY > height + 20) {
            continue;
        }


        // Set up the circle properties
        let circleDiameter = 20;
        let circleRadius = circleDiameter / 2;

        switch (enemy.type) {
            case 3:
                drawMobType3(centerX, centerY, circleDiameter, circleRadius);
                break;
            case 2:
                drawMobType2(centerX, centerY, circleDiameter, circleRadius);
                break;
            default:
                drawMobType1(centerX, centerY, circleDiameter, circleRadius);
                break;
        }

        stroke(1);
        fill(255);
    }
}

function drawMobType3(centerX, centerY, circleDiameter, circleRadius) {
    let points = [
        { x: centerX, y: centerY - circleRadius }, // Top
        { x: centerX + circleRadius, y: centerY }, // Right
        { x: centerX, y: centerY + circleRadius }, // Bottom
        { x: centerX - circleRadius, y: centerY }  // Left
    ];

    // Draw the star
    stroke(0); // Black outline
    noFill(); // No fill for the star

    // Draw lines connecting the points in a star pattern
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            line(points[i].x, points[i].y, points[j].x, points[j].y);
        }
    }
}
function drawMobType2(centerX, centerY, circleDiameter, circleRadius) {

    // Draw the spiral
    stroke(0); // Black outline
    noFill(); // No fill for the spiral

    let angle = 0;
    let radius = 0;
    let maxRadius = circleRadius;

    beginShape();
    while (radius <= maxRadius) {
        let x = centerX + radius * cos(angle);
        let y = centerY + radius * sin(angle);
        vertex(x, y);
        angle += 0.1;
        radius = angle / TWO_PI * 2; // Increase radius slowly
    }
    endShape();
    stroke(1);
}

function drawMobType1(centerX, centerY, circleDiameter, circleRadius) {
    stroke(0); // Black outline
    noFill(); // No fill for the circle
    ellipse(centerX, centerY, circleDiameter, circleDiameter);

    // Draw the firing indicators
    // Up direction
    stroke('red');
    line(centerX, centerY - circleRadius, centerX, centerY);

    // Down direction
    stroke('blue');
    line(centerX, centerY + circleRadius, centerX, centerY);

    // Left direction
    stroke('green');
    line(centerX - circleRadius, centerY, centerX, centerY);

    // Right direction
    stroke('yellow');
    line(centerX + circleRadius, centerY, centerX, centerY);

    stroke(1);
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
    let media_per_unit = dist(x_0, y_0, x_1, y_1);

    return [{
        x: ((transform.a * 0 + transform.c * -20 + transform.e) / media_per_unit),
        y: ((transform.b * 0 + transform.d * -20 + transform.f) / media_per_unit)
    }, {
        x: ((transform.a * -15 + transform.c * 15 + transform.e) / media_per_unit),
        y: ((transform.b * -15 + transform.d * 15 + transform.f) / media_per_unit)
    },
    {
        x: ((transform.a * 15 + transform.c * 15 + transform.e) / media_per_unit),
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

function makeExplosion(x, y) {
    let newParticles = [];
    for (let i = 0; i < 200; i++) {
        let angelToUse = random(1, 360);

        let p = {
            x: x - 5 + random(1, 10),
            y: y - 5 + random(1, 10),
            x_speed: random(1, 10) * cos(angelToUse - PI / 2),
            y_speed: random(1, 10) * sin(angelToUse - PI / 2),
            time_to_live: 30 + random(1, 20)
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
    energy = 8000;

    setTimeout(gameOn, 5000);
}

function draw() {
    clear();

    drawOtherShips();
    drawParticles();
    drawEnemies();

    if (game_state == CRASH_START) {
        game_state = CRASH_GOING_ON;
        angle = 0;
        speed_x = 0;
        speed_y = 0;
        score -= 2;
        updateScore(score);
        makeExplosion(width / 2, height / 2);
        if (gameWithSound) {
            shipExplosionSound.play();
        }

        setTimeout(restartAtStart, 4000);
    }

    if (game_state == CRASH_GOING_ON) {
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

    if (keyIsDown(RIGHT_ARROW) || keyIsDown(70)) {
        angel_acceleration += 0.05;
        if (angel_acceleration > MAX_ANGLE_ACCELERATION) {
            angel_acceleration = MAX_ANGLE_ACCELERATION;
        }
        angle += angel_acceleration;
    } else if (keyIsDown(LEFT_ARROW) || keyIsDown(83)) {
        angel_acceleration -= 0.05;
        if (angel_acceleration < -MAX_ANGLE_ACCELERATION) {
            angel_acceleration = -MAX_ANGLE_ACCELERATION;
        }
        angle += angel_acceleration;
    } else {
        angel_acceleration = 0;
    }

    /* z key or j*/
    if (keyIsDown(90) || keyIsDown(74)) {
        maybeFireBullet();
    }

    /** Up arrow or e */
    if ((game_state == 0 || game_state == 1) && (keyIsDown(UP_ARROW) || keyIsDown(69)) && drawEnergy(1)) {
        currentAcceleration += maxAcceleration / 30;
        if (currentAcceleration > maxAcceleration) {
            currentAcceleration = maxAcceleration;
        }

        if (gameWithSound) {
            if (!thrustSound.isPlaying()) {
                thrustSound.play();
                thrustSound.setVolume(0.5);
            } else {
                thrustSound.amp(0.5, 0.2);
            }
        }

        addParticles();

        speed_x += currentAcceleration * cos(angle - (3.14 / 2));
        speed_y += currentAcceleration * sin(angle - (3.14 / 2));;
    } else {
        if (gameWithSound) {
            thrustSound.amp(0, 0.2);
        }

    }

    /* Gravity */
    speed_y += 0.0001;

    if(!energy) {
        speed_y += 0.001;
    }

    /* Air resistance */
    speed_x -= (speed_x / 20);
    speed_y -= (speed_y / 20);
}

