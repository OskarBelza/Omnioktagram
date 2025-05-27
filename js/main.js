import { OmnioktagramApp } from './OmnioktagramApp.js';

const toggleThemeBtn = document.getElementById('toggleTheme');
const app = new OmnioktagramApp('octogramCanvas', toggleThemeBtn);

document.getElementById('resetButton').addEventListener('click', () => {
    app.resetState();
});

document.getElementById('skipButton').addEventListener('click', () => {
    app.skipAction();
});

document.getElementById('loadSpellButton').addEventListener('click', () => {
    const code = document.getElementById('spellInput').value.trim();
    app.loadSpellFromCode(code);
});

document.getElementById('undoButton').addEventListener('click', () => {
    app.undoLastAction();
});

