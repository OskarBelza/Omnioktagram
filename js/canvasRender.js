import { denormalizePoint, getPointIndex } from './utils.js';
import { CONFIG } from './config.js';

export function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawBaseLines(ctx, points, center, radius) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = radius * CONFIG.BASE_LINE_WIDTH_SCALE;

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
        }
    }

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

export function drawVertices(ctx, points, radius) {
    const vertexRadius = radius * CONFIG.VERTEX_RADIUS_SCALE;
    const lineWidth = radius * CONFIG.VERTEX_LINE_WIDTH_SCALE;

    for (const pt of points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, vertexRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

export function drawTempLine(ctx, dragging, startPoint, currentMouse, actions, radius) {
    if (!dragging || !startPoint) return;

    let fromX = startPoint.x;
    let fromY = startPoint.y;
    const fromKey = `${startPoint.x},${startPoint.y}`;
    let markerCount = actions.filter(a =>
        (a.type === 'marker' || a.type === 'skip') &&
        `${denormalizePoint(a.point, ctx.canvas).x},${denormalizePoint(a.point, ctx.canvas).y}` === fromKey
    ).length;

    const baseRingRadius = radius * CONFIG.ARC_BASE_RADIUS_SCALE;
    const ringSpacing = radius * CONFIG.ARC_RING_SPACING_SCALE;
    const arcRadius = baseRingRadius + (markerCount - 1) * ringSpacing;

    if (markerCount > 0) {
        const dx = currentMouse.x - fromX;
        const dy = currentMouse.y - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        fromX += unitX * arcRadius;
        fromY += unitY * arcRadius;
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(currentMouse.x, currentMouse.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = radius * CONFIG.TEMP_LINE_WIDTH_SCALE;
    ctx.stroke();
}

export function drawActions(ctx, actions, points, radius) {
    const currentCount = {};
    const connectionMap = {};

    for (const action of actions) {
        if (action.type !== 'line') continue;

        let from = denormalizePoint(action.from, ctx.canvas);
        const to = denormalizePoint(action.to, ctx.canvas);
        const fromKey = `${from.x},${from.y}`;

        const actionIndex = actions.indexOf(action);
        const markerCount = actions.slice(0, actionIndex).filter(a =>
            (a.type === 'marker' || a.type === 'skip') &&
            `${denormalizePoint(a.point, ctx.canvas).x},${denormalizePoint(a.point, ctx.canvas).y}` === fromKey
        ).length;

        if (markerCount > 0) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length > 0) {
                const unitX = dx / length;
                const unitY = dy / length;

                const baseRingRadius = radius * CONFIG.ARC_BASE_RADIUS_SCALE;
                const ringSpacing = radius * CONFIG.ARC_RING_SPACING_SCALE;
                const arcRadius = baseRingRadius + (markerCount - 1) * ringSpacing;

                from.x += unitX * arcRadius;
                from.y += unitY * arcRadius;
            }
        }

        const indexFrom = getPointIndex(denormalizePoint(action.from, ctx.canvas), points);
        const indexTo = getPointIndex(denormalizePoint(action.to, ctx.canvas), points);
        if (indexFrom === -1 || indexTo === -1) continue;

        const key = [indexFrom, indexTo].sort().join('-');
        if (!connectionMap[key]) connectionMap[key] = [];
        connectionMap[key].push({ action, from, to });
    }

    for (const key in connectionMap) {
        const group = connectionMap[key];
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

            ctx.beginPath();
            ctx.moveTo(item.from.x, item.from.y);
            ctx.quadraticCurveTo(cx, cy, item.to.x, item.to.y);
            ctx.strokeStyle = item.action.color;
            ctx.lineWidth = radius * CONFIG.CONNECTION_LINE_WIDTH_SCALE;
            ctx.stroke();
        });
    }

    for (const action of actions) {
        if (action.type !== 'marker' && action.type !== 'skip') continue;

        const point = denormalizePoint(action.point, ctx.canvas);
        const key = `${action.point.x},${action.point.y}`;
        const ringIndex = currentCount[key] || 0;

        const baseRingRadius = radius * CONFIG.ARC_BASE_RADIUS_SCALE;
        const ringSpacing = radius * CONFIG.ARC_RING_SPACING_SCALE;
        const arcRadius = baseRingRadius + ringIndex * ringSpacing;

        ctx.beginPath();
        if (action.type === 'skip') {
            ctx.setLineDash([radius * CONFIG.SKIP_DASH_SCALE[0], radius * CONFIG.SKIP_DASH_SCALE[1]]);
        }

        ctx.arc(point.x, point.y, arcRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.type === 'skip'
            ? radius * CONFIG.SKIP_LINE_WIDTH_SCALE
            : radius * CONFIG.MARKER_LINE_WIDTH_SCALE;
        ctx.stroke();
        ctx.setLineDash([]);

        currentCount[key] = ringIndex + 1;
    }
}
