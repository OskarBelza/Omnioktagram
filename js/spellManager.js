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
    const digits = code.split('').map(d => parseInt(d, 10));

    if (digits.length !== SPELL_CONFIG.CODE_LENGTH || digits.some(d => isNaN(d) || d < 0 || d > 9)) {
        alert("Kod zaklęcia musi zawierać dokładnie 8 cyfr od 0 do 9.");
        return;
    }

    let currentPoint = points[0];
    state.lastEndPoint = currentPoint;

    for (let i = 0; i < digits.length; i++) {
        const val = digits[i];
        const prevVal = i > 0 ? digits[i - 1] : null;
        const color = getActionColor(state.actionCount);
        const infoSet = generatePointInfo(i);

        if (i === 0 && val === 8) {
            state.pointDataLog.push({ point: currentPoint, info: infoSet[7] });
            state.spellCode.push(8);
            state.totalManaCost += 8;
            state.actions.push({
                type: 'marker',
                color,
                point: normalizePoint(currentPoint, state.canvas)
            });
        } else if (val === 0) {
            state.pointDataLog.push({ point: currentPoint, info: infoSet[8] });
            state.spellCode.push(0);
            state.actions.push({
                type: 'skip',
                color,
                point: normalizePoint(currentPoint, state.canvas)
            });
        } else {
            const mappedIndex = val === 8 ? 0 : val;
            if (mappedIndex < 0 || mappedIndex >= SPELL_CONFIG.MAX_INDEX) continue;

            const targetPoint = points[mappedIndex];
            const manaCost = val === 8 ? 8 : val;

            if (val === prevVal) {
                state.pointDataLog.push({ point: currentPoint, info: infoSet[mappedIndex] });
                state.spellCode.push(val);
                state.totalManaCost += manaCost;
                state.actions.push({
                    type: 'marker',
                    color,
                    point: normalizePoint(currentPoint, state.canvas)
                });
            } else {
                state.pointDataLog.push({ point: targetPoint, info: infoSet[mappedIndex] });
                state.spellCode.push(val);
                state.totalManaCost += manaCost;
                state.actions.push({
                    type: 'line',
                    color,
                    from: normalizePoint(currentPoint, state.canvas),
                    to: normalizePoint(targetPoint, state.canvas)
                });
                currentPoint = targetPoint;
                state.lastEndPoint = targetPoint;
            }
        }
        state.actionCount++;
        if (updateStepCallback) updateStepCallback(state.actionCount);
    }
}
