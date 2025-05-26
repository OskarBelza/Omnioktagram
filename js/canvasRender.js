import { denormalizePoint, getPointIndex } from './utils.js';
import { CONFIG } from './config.js';

export function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawBaseLines(ctx, points, center, radius) {
    setStroke(ctx, 'white', radius * CONFIG.BASE_LINE_WIDTH_SCALE);

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            drawLine(ctx, points[i], points[j]);
        }
    }

    drawCircle(ctx, center, radius);
}

export function drawVertices(ctx, points, radius) {
    const vertexRadius = radius * CONFIG.VERTEX_RADIUS_SCALE;
    const lineWidth = radius * CONFIG.VERTEX_LINE_WIDTH_SCALE;

    for (const pt of points) {
        setStroke(ctx, 'white', lineWidth);
        drawCircle(ctx, pt, vertexRadius);
    }
}

export function drawTempLine(ctx, dragging, startPoint, currentMouse, actions, radius) {
    if (!dragging || !startPoint) return;

    let from = { ...startPoint };
    const fromKey = `${from.x},${from.y}`;
    const markerCount = countMarkers(actions, ctx.canvas, fromKey);

    const arcRadius = baseArcRadius(radius, markerCount);

    if (markerCount > 0) {
        from = moveAlongDirection(from, currentMouse, arcRadius);
    }

    setStroke(ctx, 'black', radius * CONFIG.TEMP_LINE_WIDTH_SCALE);
    drawLine(ctx, from, currentMouse);
}

export function drawActions(ctx, actions, points, radius) {
    const currentCount = {};
    const connectionMap = buildConnectionMap(actions, points, ctx.canvas);

    drawCurvedConnections(ctx, connectionMap, points, radius);

    for (const action of actions) {
        if (action.type !== 'marker' && action.type !== 'skip') continue;

        const point = denormalizePoint(action.point, ctx.canvas);
        const key = `${action.point.x},${action.point.y}`;
        const ringIndex = currentCount[key] || 0;

        const arcRadius = baseArcRadius(radius, ringIndex);

        if (action.type === 'skip') {
            ctx.setLineDash([radius * CONFIG.SKIP_DASH_SCALE[0], radius * CONFIG.SKIP_DASH_SCALE[1]]);
        }

        setStroke(ctx, action.color, action.type === 'skip'
            ? radius * CONFIG.SKIP_LINE_WIDTH_SCALE
            : radius * CONFIG.MARKER_LINE_WIDTH_SCALE);
        drawCircle(ctx, point, arcRadius);
        ctx.setLineDash([]);

        currentCount[key] = ringIndex + 1;
    }
}

function drawLine(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

function drawCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function setStroke(ctx, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
}

function countMarkers(actions, canvas, key) {
    return actions.filter(a =>
        (a.type === 'marker' || a.type === 'skip') &&
        `${denormalizePoint(a.point, canvas).x},${denormalizePoint(a.point, canvas).y}` === key
    ).length;
}

function baseArcRadius(radius, index) {
    return radius * CONFIG.ARC_BASE_RADIUS_SCALE + index * radius * CONFIG.ARC_RING_SPACING_SCALE;
}

function moveAlongDirection(from, to, distance) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;
    return {
        x: from.x + unitX * distance,
        y: from.y + unitY * distance
    };
}

function buildConnectionMap(actions, points, canvas) {
    const map = {};

    for (const action of actions) {
        if (action.type !== 'line') continue;

        let from = denormalizePoint(action.from, canvas);
        const to = denormalizePoint(action.to, canvas);
        const fromKey = `${from.x},${from.y}`;

        const actionIndex = actions.indexOf(action);
        const markerCount = actions.slice(0, actionIndex).filter(a =>
            (a.type === 'marker' || a.type === 'skip') &&
            `${denormalizePoint(a.point, canvas).x},${denormalizePoint(a.point, canvas).y}` === fromKey
        ).length;

        if (markerCount > 0) {
            const arcRadius = baseArcRadius(1, markerCount - 1); // scale later
            from = moveAlongDirection(from, to, arcRadius);
        }

        const indexFrom = getPointIndex(denormalizePoint(action.from, canvas), points);
        const indexTo = getPointIndex(denormalizePoint(action.to, canvas), points);
        if (indexFrom === -1 || indexTo === -1) continue;

        const key = [indexFrom, indexTo].sort().join('-');
        if (!map[key]) map[key] = [];
        map[key].push({ action, from, to });
    }

    return map;
}

function drawCurvedConnections(ctx, map, points, radius) {
    for (const key in map) {
        const group = map[key];
        const [indexA, indexB] = key.split('-').map(Number);
        const ptA = points[indexA];
        const ptB = points[indexB];
        const dx = ptB.x - ptA.x;
        const dy = ptB.y - ptA.y;
        const mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
        const length = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / length;
        const ny = dx / length;
        const baseOffset = radius * CONFIG.ACTION_CURVE_OFFSET_SCALE;

        group.forEach((item, i) => {
            const curveOffset = (i - (group.length - 1) / 2) * baseOffset;
            const cx = mid.x + nx * curveOffset;
            const cy = mid.y + ny * curveOffset;

            setStroke(ctx, item.action.color, radius * CONFIG.CONNECTION_LINE_WIDTH_SCALE);
            ctx.beginPath();
            ctx.moveTo(item.from.x, item.from.y);
            ctx.quadraticCurveTo(cx, cy, item.to.x, item.to.y);
            ctx.stroke();
        });
    }
}
