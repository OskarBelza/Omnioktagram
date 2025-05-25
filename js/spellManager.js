import { normalizePoint } from './utils.js';

export function generatePointInfo(stepIndex) {
    const dataTypes = [
        ['elementem chaosu ', 'elementem światła ', 'elemetem ognia ', 'elementem wody ',
            'elementem ziemii ', 'elementem powietrza ', 'elementem psychicznym ', 'elementem śmierci '],
        ['za K100.', 'za K2.', 'za K4.', 'za K6.', 'za K8.', 'za K10.', 'za K12.', 'za K20.'],
        ['wylosuj ', 'przemieść ', 'zaatakuj ', 'ulecz ', 'obroń ', 'okryj ', 'pokaż ', 'zniszcz '],
        ['z użyciem kreacji ', 'z użyciem dotyku ', 'z użyciem wybuchu ', 'z użyciem plamy ',
            'z użyciem ściany ', 'z użyciem pocisku ', 'z użyciem iluzji ', 'z użyciem przywołania '],
        ['i w zasięgu 9, ', ' i w zasięgu 2, ', 'i w zasięgu 3, ', 'i w zasięgu 4, ',
            'i w zasięgu 5, ', 'i w zasięgu 6, ', 'i w zasięgu 7, ', 'i w zasięgu 8, ',
            'i w zasięgu 1, '],
        ['w obszarze 9 pól ', 'w obszarze 2 pól ', 'w obszarze 3 pól ', 'w obszarze 4 pól ',
            'w obszarze 5 pól ', 'w obszarze 6 pól ', 'w obszarze 7 pól ', 'w obszarze 8 pól ',
            'w obszarze 1 pola '],
        ['przez następne 9, ', 'przez następne 2, ', 'przez następne 3, ',
            'przez następne 4, ', 'przez następne 5, ', 'przez następne 6, ',
            'przez następne 7, ', 'przez następne 8, ', 'przez 1, '],
        ['Za 9 tur, ', 'Za 2 tury, ', 'Za 3 tury, ', 'Za 4 tury, ', 'Za 5 tur, ', 'Za 6 tur, ', 'Za 7 tur, ',
            'Za 8 tur, ', 'W tej turze, ']
    ];

    return dataTypes[stepIndex % dataTypes.length];
}

export function showHistory(historyDiv, pointDataLog, totalManaCost, spellCode) {
    const customOrder = [7, 6, 5, 4, 3, 2, 0, 1];
    const orderedInfo = customOrder
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

    if (digits.length !== 8 || digits.some(d => isNaN(d) || d < 0 || d > 9)) {
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
            if (mappedIndex < 0 || mappedIndex > 7) continue;

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
