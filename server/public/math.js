
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