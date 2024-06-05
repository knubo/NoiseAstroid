
// Function to calculate the distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Function to check if a point is inside a circle
function pointInCircle(px, py, cx, cy, r) {
    return distance(px, py, cx, cy) <= r;
}

// Function to check if a line segment intersects a circle
window.lineIntersectsCircle = function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
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



window.lineIntersectsCircleRadius = function lineIntersectsCircleRadius(px, py, angle, cx, cy, r) {
    // Convert angle to direction vector

    const directionCorrection = + (Math.PI / 2);

    const dx = Math.cos(angle - directionCorrection);
    const dy = Math.sin(angle - directionCorrection);
    
    const A = dx * dx + dy * dy;
    const B = 2 * ((px - cx) * dx + (py - cy) * dy);
    const C = (px - cx) * (px - cx) + (py - cy) * (py - cy) - r * r;

    const discriminant = B * B - 4 * A * C;

    if (discriminant > 0) {
        const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
        const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);
        return true; // { intersects: true, t1, t2 };
    } else if (discriminant === 0) {
        const t = -B / (2 * A);
        return true; //{ intersects: true, t1: t, t2: t };
    } else {
        return false; //{ intersects: false };
    }
}

// Function to check for collision between the ship and the circle
window.crashDetection = function crashDetection(shipCoordinates, circleX, circleY, radius) {
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

function lineIntersectsSegment(px, py, dx, dy, v1, v2) {
    const x1 = v1.x, y1 = v1.y;
    const x2 = v2.x, y2 = v2.y;

    const A1 = y2 - y1;
    const B1 = x1 - x2;
    const C1 = A1 * x1 + B1 * y1;

    const A2 = dy;
    const B2 = -dx;
    const C2 = A2 * px + B2 * py;

    const det = A1 * B2 - A2 * B1;

    if (det === 0) {
        // Lines are parallel
        return false;
    } else {
        const ix = (B2 * C1 - B1 * C2) / det;
        const iy = (A1 * C2 - A2 * C1) / det;

        // Check if the intersection point (ix, iy) is on the line segment
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        return (ix >= minX && ix <= maxX && iy >= minY && iy <= maxY);
    }
}

window.laserHitsTriangle = function laserHitsTriangle(px, py, angle, triangle) {

    const directionCorrection = + (Math.PI / 2);

    const dx = Math.cos(angle + directionCorrection);
    const dy = Math.sin(angle + directionCorrection);

    const [v1, v2, v3] = triangle;

    const hitsSide1 = lineIntersectsSegment(px, py, dx, dy, v1, v2);
    const hitsSide2 = lineIntersectsSegment(px, py, dx, dy, v2, v3);
    const hitsSide3 = lineIntersectsSegment(px, py, dx, dy, v3, v1);

    return hitsSide1 || hitsSide2 || hitsSide3;
}

window.getTextBoxCoordinates = function getTextBoxCoordinates(playerX, playerY) {
    // Center of the screen
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate the direction from the center to the player's position
    const dx = playerX - centerX;
    const dy = playerY - centerY;

    // Slope of the line from the center to the player's position
    const slope = dy / dx;

    let x, y;

    // Determine the intersection point with the screen boundary
    if (playerX < 0) { // Left boundary
        x = 0;
        y = centerY - (centerX * slope);
    } else if (playerX > width) { // Right boundary
        x = width;
        y = centerY + ((width - centerX) * slope);
    } else if (playerY < 0) { // Top boundary
        y = 0;
        x = centerX - (centerY / slope);
    } else if (playerY > height) { // Bottom boundary
        y = height;
        x = centerX + ((height - centerY) / slope);
    } else {
        // Player is within the screen boundaries
        x = playerX;
        y = playerY;
    }

    // Clamp the y-coordinate to the screen boundaries
    if (y < 0) y = 0;
    if (y > height) y = height;

    // Clamp the x-coordinate to the screen boundaries
    if (x < 0) x = 0;
    if (x > width) x = width;

    return { x, y };
}