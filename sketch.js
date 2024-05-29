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

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);
    noiseSeed(1);
}

function draw_background() {

    // Iterate from top to bottom.
    for (let y = 0; y < height; y += 10) {
        // Iterate from left to right.
        for (let x = 0; x < width; x += 10) {
            // Scale the input coordinates.
            let nx = noiseScale * x + noiseOffsetX;
            let ny = noiseScale * y + noiseOffsetY;

            // Compute the noise value.
            if (noise(nx, ny) > 0.5) {
                stroke(1);
                circle(x, y, 5);
            }
        }
    }
}

function addParticles() {
    for (let i = 0; i < 2; i++) {
        let offset = createVector(-10 + random(20), 17); // Offset for the particles below the ship
        offset.rotate(angle); // Rotate the offset vector based on the ship's angle

        let angelToUse = angle + ( (10 - random(0, 20) ) / 2.0 * 3.14);

        let particle = {
            x: width / 2 + offset.x, // Start at the center of the screen with offset
            y: height / 2 + offset.y, // Below the ship with offset
            x_speed: speed_x - (currentAcceleration * 500 * cos(angelToUse - PI / 2)),
            y_speed: speed_y - (currentAcceleration * 500 * sin(angelToUse - PI / 2)),
            time_to_live: 70 // Initial alpha value for fading out
        };

        console.log(particle.y_speed+ " "+particle.x_speed);
        particles.push(particle);    }
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


function drawShip() {
    // Set the ship's position to the center of the screen
    const shipX = width / 2;
    const shipY = height / 2;

    // Save the current state of the canvas
    push();

    // Translate to the ship's position
    translate(shipX, shipY);

    // Rotate the ship based on the angle variable
    rotate(angle);

    // Draw the triangular ship pointing upwards
    fill(255); // White color for the ship
    beginShape();
    vertex(0, -20); // Tip of the triangle pointing upwards
    vertex(-15, 15); // Bottom left corner
    vertex(15, 15); // Bottom right corner
    endShape(CLOSE);

    // Restore the previous state of the canvas
    pop();
}

function draw() {
    clear();
    draw_background();
    drawShip();
    drawParticles();

    // Update the position based on the current speed and angle
    noiseOffsetX += speed_x;
    noiseOffsetY += speed_y; 

    if(keyIsDown(RIGHT_ARROW)) {
        angle += 0.25;
    }
    if(keyIsDown(LEFT_ARROW)) {
        angle -= 0.25;
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

