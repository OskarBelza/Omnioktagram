export function normalizePoint(p, canvas) {
    return { x: p.x / canvas.width, y: p.y / canvas.height };
}

export function denormalizePoint(p, canvas) {
    return { x: p.x * canvas.width, y: p.y * canvas.height };
}

export function getPointIndex(pt, points) {
    for (let i = 0; i < points.length; i++) {
        if (Math.abs(points[i].x - pt.x) < 1e-2 && Math.abs(points[i].y - pt.y) < 1e-2) {
            return i;
        }
    }
    return -1;
}

export function getActionColor(index) {
    const variable = getComputedStyle(document.body).getPropertyValue(`--color-action-${index}`);
    return variable.trim() || 'black';
}

export function pointsEqual(p1, p2, tolerance = 1e-6) {
    return p1 && p2 && Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

export function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getClosestPoint(offsetX, offsetY, points, threshold, conditionFn = () => true) {
    for (const pt of points) {
        const dx = pt.x - offsetX;
        const dy = pt.y - offsetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold && conditionFn(pt)) {
            return pt;
        }
    }
    return null;
}
