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
