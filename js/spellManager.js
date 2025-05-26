import { normalizePoint } from './utils.js';
import { SPELL_CONFIG } from './config.js';

export function generatePointInfo(stepIndex) {
    return SPELL_CONFIG.DATA_TYPES[stepIndex % SPELL_CONFIG.DATA_TYPES.length];
}

export function showHistory(historyDiv, pointDataLog, totalManaCost, spellCode) {
    const orderedInfo = SPELL_CONFIG.CUSTOM_ORDER
        .map(i => pointDataLog[i]?.info ?? '')
        .join('');
    const spellLine = spellCode.join('');

    historyDiv.innerHTML = `
        <h2>Całkowity koszt many:</h2>
        <p style="font-size: 1.5em;">${totalManaCost}</p>
        <h2>Opis zaklęcia:</h2>
        <p style="font-size: 1.5em;">${orderedInfo}</p>
        <h3>Kod zaklęcia:</h3>
        <p style="font-size: 1.2em;">${spellLine}</p>
    `;
}

export function loadSpellFromCode(code, state, points, getActionColor, updateStepCallback) {
    const digits = parseSpellCode(code);
    if (!digits) return;

    let currentPoint = points[0];
    state.lastEndPoint = currentPoint;

    digits.forEach((val, i) => {
        const prevVal = i > 0 ? digits[i - 1] : null;
        const color = getActionColor(state.actionCount);
        const infoSet = generatePointInfo(i);

        handleSpellStep({ i, val, prevVal, state, color, infoSet, currentPoint, points });
        currentPoint = state.lastEndPoint;

        state.actionCount++;
        if (updateStepCallback) updateStepCallback(state.actionCount);
    });
}

function parseSpellCode(code) {
    const digits = code.split('').map(d => parseInt(d, 10));
    const valid = digits.length === SPELL_CONFIG.CODE_LENGTH && digits.every(d => !isNaN(d) && d >= 0 && d <= 8);
    if (!valid) {
        alert("Kod zaklęcia musi zawierać dokładnie 8 cyfr od 0 do 9.");
        return null;
    }
    return digits;
}

function handleSpellStep({ i, val, prevVal, state, color, infoSet, currentPoint, points }) {
    const canvas = state.canvas;

    if (i === 0 && val === 8) {
        pushMarker(state, currentPoint, infoSet[7], color, canvas);
        state.spellCode.push(8);
        state.totalManaCost += 8;
        return;
    }

    if (val === 0) {
        pushSkip(state, currentPoint, infoSet[8], color, canvas);
        state.spellCode.push(0);
        return;
    }

    const mappedIndex = val === 8 ? 0 : val;
    if (mappedIndex < 0 || mappedIndex >= SPELL_CONFIG.MAX_INDEX) return;

    const targetPoint = points[mappedIndex];
    const manaCost = val === 8 ? 8 : val;

    const pointUsed = (val === prevVal) ? currentPoint : targetPoint;
    const actionType = (val === prevVal) ? 'marker' : 'line';
    const info = infoSet[mappedIndex];

    state.pointDataLog.push({ point: pointUsed, info });
    state.spellCode.push(val);
    state.totalManaCost += manaCost;

    if (actionType === 'marker') {
        state.actions.push({ type: 'marker', color, point: normalizePoint(currentPoint, canvas) });
    } else {
        state.actions.push({
            type: 'line',
            color,
            from: normalizePoint(currentPoint, canvas),
            to: normalizePoint(targetPoint, canvas)
        });
        state.lastEndPoint = targetPoint;
    }
}

function pushMarker(state, point, info, color, canvas) {
    state.pointDataLog.push({ point, info });
    state.actions.push({
        type: 'marker',
        color,
        point: normalizePoint(point, canvas)
    });
}

function pushSkip(state, point, info, color, canvas) {
    state.pointDataLog.push({ point, info });
    state.actions.push({
        type: 'skip',
        color,
        point: normalizePoint(point, canvas)
    });
}