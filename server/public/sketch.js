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
let spawnX = 0;
let spawnY = 0;

let speed_x = 0;
let speed_y = 0;

let particles = [];
let otherShips = {};

let lastBulletFired = 0;
let bullets = [];
let powerups = [];

let enemies = {};

let thrustSound;
let shootSound;
let explosionSound;
let shipExplosionSound;
let bulletSound, bulletSound2, bulletSound3;
let laserSound;

let energy = 8000;
let maxEnergy = 10000;
let powerupStatus = {};

const SHIELD_UP = 1;
const CRASH_START = 2;
const CRASH_GOING_ON = 3;

let game_state = -1;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let gameWithSound = urlParams.get('audio');
let laserOn = 0;

let width = window.innerWidth;
let height = window.innerHeight;

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
        laserSound = loadSound('audio/laser-charge-175727.mp3');
        shieldSound = loadSound('audio/energy-hum-29083.mp3');
        checkpointSound = loadSound('audio/success_bell-6776.mp3');
        powerUpSound = loadSound('audio/message-incoming-132126.mp3');
    }

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);
    noiseSeed(1);
    powerupStatus["Laser"] = 0;
    powerupStatus["Shield"] = 0;

    if(gameWithSound) {
        bulletSound.setVolume(0.5);
        bulletSound2.setVolume(0.5);            
    }

    updatePowerups(powerupStatus);
}

window.startGame = function startGame() {
    if (gameWithSound) {
        shieldSound.setLoop(true);
        thrustSound.setLoop(true);
        ambienSound.setLoop(true);
        ambienSound.play();
    }
    document.getElementById('introDiv').hidden = true;
    restartAtStart();
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
                if (!bulletSound2.isPlaying()) {
                    bulletSound2.play();
                }

                break;
            case 3:
                if (!bulletSound3.isPlaying()) {
                    bulletSound3.play();
                }
                break;
            default:
                if (!bulletSound.isPlaying()) {
                    bulletSound.play();
                }
                break;
        }
    }


}

window.addEnemy = function addEnemy(data) {
//    console.log("Enemy added " + JSON.stringify(data));
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

window.otherShipDied = function otherShipDied(obj) {
    let id = obj.id;

    let data = otherShips[id];
    clearOtherShip(id);

    if (!data) {
        return;
    }

    const rel_x = (data.x - noiseOffsetX) * 500;
    const rel_y = (data.y - noiseOffsetY) * 500;

    const shipX = data.w + rel_x;
    const shipY = data.h + rel_y;

    makeExplosion(shipX, shipY, 1);
    if (gameWithSound) {
        explosionSound.play();
    }

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

    if (energy > maxEnergy) {
        energy = maxEnergy;
    }

    if (energy < 0) {
        energy = 0;
    }

    updateEnergy(energy);

    return energy != 0;
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

function drawBackground(shipCoordinates) {

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
                let xcheck = abs((Math.floor(noiseOffsetX * 500) + x) % 3000);
                let ycheck = abs((Math.floor(noiseOffsetY * 500) + y) % 3000);

                if (xcheck < 11 && ycheck < 11) {
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

                if (xcheck > 1500 && xcheck < 1511 && ycheck > 1500 && ycheck < 1511) {
                    drawCheckpointIcon(x, y);

                    if (x > (width / 2 - 70) && x < (width / 2 + 70) && y > (height / 2 - 70) && y < (height / 2) + 70) {
                        spawnX = noiseOffsetX;
                        spawnY = noiseOffsetY;

                        if (gameWithSound && !checkpointSound.isPlaying()) {
                            checkpointSound.play();
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

function ranomPowerUp() {
    switch (getRandomInt(3)) {
        case 0:
            return "E";
        case 1:
            return "S"
        case 2:
            return "L";
    }
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
            killEnemyAt(enemy, enemyX, enemyY);
            return 1;
        }
    }
    return 0;
}

function killEnemyAt(enemy, enemyX, enemyY) {
    delete enemies[id]; '';
    score++;
    updateScore(score);

    sendClearEnemy(enemy);
    makeExplosion(enemyX, enemyY);
    if (gameWithSound) {
        explosionSound.play();
    }

    if (random(1, 100) <= 2) {
        powerups.push({
            "x": enemyX, "noiseOffsetX": noiseOffsetX,
            "y": enemyY, "noiseOffsetY": noiseOffsetY,
            "powerup": ranomPowerUp(),
            "ttl": 700
        });
    }

}

function drawPowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        let powerup = powerups[i];

        powerup.y += 1;
        powerup.ttl--;

        if (powerup.ttl <= 0) {
            powerups.splice(i, 1);
            continue;
        }

        const x = powerup.x + (powerup.noiseOffsetX - noiseOffsetX) * 500;
        const y = powerup.y + (powerup.noiseOffsetY - noiseOffsetY) * 500;

        /* Outside of view screen - no need to draw */
        if (x < 0 || x > width || y < 0 || y > height) {
            continue;
        }

        drawPowerupLetter(x, y, powerup.powerup);

        if (x > (width / 2 - 10) && x < (width / 2 + 10) && y > (height / 2 - 10) && y < (height / 2) + 10) {
            powerups.splice(i, 1);
            addPowerUp(powerup.powerup);
            continue;
        }
    }
}

function atCenter(x, y) {
    return x < (width / 2) + 5 && x > (width / 2) + 5 && y < (height / 2) + 5 && y > (height / 2) + 5;
}

function drawCheckpointIcon(x, y) {
    let size = 40;
    // Calculate proportions
    let flagWidth = size * 0.6;
    let flagHeight = size * 0.4;
    let poleHeight = size;
    let poleWidth = size * 0.1;
    let baseSize = size * 0.2;

    // Draw the flag
    fill(255, 0, 0); // Red flag
    noStroke();
    beginShape();
    vertex(x, y - poleHeight / 2);
    vertex(x + flagWidth, y - poleHeight / 2 + flagHeight / 2);
    vertex(x, y - poleHeight / 2 + flagHeight);
    endShape(CLOSE);

    // Draw the pole
    fill(100); // Grey pole
    rect(x - poleWidth / 2, y - poleHeight / 2, poleWidth, poleHeight);

    // Draw the base
    fill(0); // Black base
    rect(x - baseSize / 2, y + poleHeight / 2, baseSize, baseSize / 2);
    fill(255);
    stroke(1);
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

function drawPowerupLetter(x, y, letter) {
    // Draw the plus
    const size = 30;
    let plusWidth = size * 0.6;
    let plusThickness = size * 0.1;

    stroke("green");
    // Draw the "S" text in the middle
    textSize(size * 0.5);
    textAlign(CENTER, CENTER);
    fill("green"); // White text
    text(letter, x, y);
    fill(255);
    stroke(1);
}

function drawEnemies(shipCoordinates) {

    for (id in enemies) {
        let enemy = enemies[id];

        if (!enemy.alive) {
            continue;
        }

        let centerX = (enemy.x - noiseOffsetX) * 500;
        let centerY = (enemy.y - noiseOffsetY) * 500;

        if(enemy.type == 4 && (centerX < -500-width || centerX > width + 500 || centerY < -500-height || centerY > height + 500)) {
            continue;
        } else        /* Outside of view screen - no need to draw */
        if (centerX < -20-width || centerX > width + 20 || centerY < -20-height || centerY > height + 20) {
            continue;
        }

        if (laserOn && lineIntersectsCircleRadius(width / 2, height / 2, angle, centerX, centerY, 20)) {
            killEnemyAt(enemy, centerX, centerY);
            continue
        }


        // Set up the circle properties
        let circleDiameter = 20;
        let circleRadius = circleDiameter / 2;

        switch (enemy.type) {
            case 4:
                let angle = drawMobType4(centerX, centerY, circleRadius);
                if(game_state == 0 && laserHitsTriangle(centerX, centerY, angle-PI/2, shipCoordinates)) {
                    if(dist(centerX, centerY, width/2, height/2) < 500) {
                        game_state = CRASH_START;
                    }
                }
                break;
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

function drawMobType4(centerX, centerY, mobRadius) {
    let laserRange = 500;

    // Draw the mob
    fill(0); // Black mob
    noStroke();
    ellipse(centerX, centerY, mobRadius * 2, mobRadius * 2);

    // Calculate the laser direction based on system time
    let currentTime = millis() / 1000; // Get current time in seconds
    let angle = (currentTime % 4) / 4 * TWO_PI; // Complete revolution every 2 seconds

    // Calculate the end point of the laser
    let laserEndX = centerX + laserRange * cos(angle);
    let laserEndY = centerY + laserRange * sin(angle);

    // Draw the laser
    stroke(255, 0, 0); // Red laser
    strokeWeight(2);
    line(centerX, centerY, laserEndX, laserEndY);
    stroke(1);
    fill(255);
    strokeWeight(1);
    return angle;
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

function drawOtherShips(shipCoordinates) {

    Object.values(otherShips).forEach(value => {
        const rel_x = (value.x - noiseOffsetX) * 500;
        const rel_y = (value.y - noiseOffsetY) * 500;

        const shipX = value.w + rel_x;
        const shipY = value.h + rel_y;

        if (shipX < -20 || shipX > width + 20 || shipY < -20 || shipY > height + 20) {
            let { x, y } = getTextBoxCoordinates(shipX, shipY);
            fill("yellow"); // White color for the text box

            const nick = getPlayerShortNick(value.id);
            if (x > width / 2) {
                x -= nick.length * 3.5;
            } else {
                x += nick.length * 3.5;
            }



            rect(x - 25, y - 20, (nick.length * 7) + 5, 20); // Adjust size as needed


            fill(0); // Black color for the text
            textSize(10);
            textAlign(CENTER, CENTER);
            textFont('Courier New');
            text(nick, x, y - 10);
            fill(255);
        }

        drawOneShip(shipX, shipY, value.direction, value.laser, value.shield);

        fill(0);
        stroke(1);
        textSize(10);
        textAlign(CENTER, CENTER);
        textFont("Courier New")
        text(getPlayerShortNick(value.id), shipX, shipY + 30);
        fill(255);

        if (game_state == 0 && value.laser && laserHitsTriangle(shipX, shipY, value.direction, shipCoordinates)) {
            game_state = CRASH_START;
        }

    });
}

function drawShip() {
    // Set the ship's position to the center of the screen
    const shipX = width / 2;
    const shipY = height / 2;

    // Save the current state of the canvas
    let transform = drawOneShip(shipX, shipY, angle, laserOn, game_state == SHIELD_UP);

    return transformationToCoordinates(transform);
}



function drawOneShip(shipX, shipY, shipAngle, laser, shield) {
    push();

    stroke(1);
    if (shield) {
        fill("green");
        circle(shipX, shipY, 53);
    }

    if (laser) {
        stroke("red");
    }
    // Translate to the ship's position
    translate(shipX, shipY);

    // Rotate the ship based on the angle variable
    rotate(shipAngle);

    // Draw the triangular ship pointing upwards
    fill(255); // White color for the ship
    beginShape();

    vertex(0, -20); // Tip of the triangle pointing upwards

    if (laser) {
        vertex(0, -800);
        vertex(0, -20);
    }

    vertex(-15, 15); // Bottom left corner
    vertex(15, 15); // Bottom right corner
    endShape(CLOSE);
    stroke(1);

    let transform = drawingContext.getTransform();
    // Restore the previous state of the canvas    
    pop();
    return transform;
}

function makeExplosion(x, y, noBroadcast) {
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

    if (!noBroadcast) {
        sendParticleUpdate(newParticles);
    }

}

function gameOn() {
    game_state = 0;
}

function addPowerUp(powerupLetter) {
    switch (powerupLetter) {
        case "E":
            maxEnergy += 50;
            break;
        case "S":
            powerupStatus["Shield"]++;
            break;
        case "L":
            powerupStatus["Laser"]++;
            break;
    }
    updatePowerups(powerupStatus);

    if(gameWithSound) {
        powerUpSound.play();
    }
}

function usePowerup(type) {
    if (powerupStatus[type] < 1) {
        return 0;
    }

    powerupStatus[type]--;
    updatePowerups(powerupStatus);

    return 1;
}

function restartAtStart() {
    noiseOffsetX = spawnX;
    noiseOffsetY = spawnY;
    game_state = SHIELD_UP;
    angle = 0;
    speed_x = 0;
    speed_y = 0;
    energy = 8000;

    setTimeout(gameOn, 5000);
}

function draw() {

    if (game_state == -1) {
        return;
    }

    clear();

    drawParticles();
    
    drawPowerups();

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
        sendIDied();

        setTimeout(restartAtStart, 4000);
    }

    if (game_state == CRASH_GOING_ON) {
        drawBackground([]);
        drawBullets([]);
        drawOtherShips([]);
        drawEnemies([]);
        return;
    } else {
        sendLocationUpdate(noiseOffsetX, noiseOffsetY, angle, width / 2, height / 2, laserOn, game_state == SHIELD_UP);

        let shipCoordinates = drawShip();

        drawOtherShips(shipCoordinates);
        drawBackground(shipCoordinates);
        drawBullets(shipCoordinates);
        drawEnemies(shipCoordinates);
    }



    // Update the position based on the current speed and angle
    noiseOffsetX += speed_x;
    noiseOffsetY += speed_y;

    if (laserOn) {

    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(70)) {
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
    if (!laserOn && (keyIsDown(90) || keyIsDown(74))) {
        maybeFireBullet();
    }

    /* 65 = a,  85 = u*/
    if (!laserOn && (keyIsDown(65) || keyIsDown(85)) && usePowerup("Laser")) {
        laserOn = 1;
        if (gameWithSound) {
            laserSound.play();
        }
        setTimeout(laserOff, 2000);
    }

    if (!laserOn && game_state == 0 && (keyIsDown(DOWN_ARROW) || keyIsDown(68)) && usePowerup("Shield")) {
        game_state = 1;
        if (gameWithSound) {
            shieldSound.play();
        }
        setTimeout(shieldOff, 3000);
    }


    /** Up arrow or e */
    if (!laserOn && (game_state == 0 || game_state == 1) && (keyIsDown(UP_ARROW) || keyIsDown(69)) && drawEnergy(1)) {
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

    if (!energy) {
        speed_y += 0.001;
    }

    /* Air resistance */
    speed_x -= (speed_x / 20);
    speed_y -= (speed_y / 20);
}

function laserOff() {
    laserOn = 0;
    if (gameWithSound) {
        laserSound.stop();
    }

}

function shieldOff() {
    game_state = 0;
    if (gameWithSound) {
        shieldSound.stop();
    }
}