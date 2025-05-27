import { ICON_CONFIG } from './config.js';

export function updateThemeIcon(toggleThemeBtn) {
    const isLight = document.body.classList.contains('light-mode');
    toggleThemeBtn.textContent = isLight ? '🌙' : '🌞';
}

export function updateVertexIcons(stepIndex, points, canvas, radius) {
    const icons = document.querySelectorAll('.vertex-icon');

    const offset = radius * ICON_CONFIG.ICON_OFFSET_SCALE;
    const baseIconSize = radius * ICON_CONFIG.ICON_BASE_SIZE_SCALE;
    const scale = ICON_CONFIG.STEP_ICON_SCALE[stepIndex] ?? 1.0;

    const iconSize = baseIconSize * scale;
    const fontSize = iconSize * ICON_CONFIG.ICON_FONT_SIZE_RATIO;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    icons.forEach((el, index) => {
        const base = points[index];
        const angle = (Math.PI / 4) * index - Math.PI / 2;

        const x = base.x + Math.cos(angle) * offset;
        const y = base.y + Math.sin(angle) * offset;

        const leftPercent = (x / cssWidth) * 100;
        const topPercent = (y / cssHeight) * 100;

        const iconStep = Math.min(stepIndex, 7);
        const isTextStep = stepIndex >= 2;

        el.className = `vertex-icon step-${stepIndex}`;
        el.style.left = `${leftPercent}%`;
        el.style.top = `${topPercent}%`;
        el.style.width = `${iconSize}px`;
        el.style.height = `${iconSize}px`;
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${iconSize}px`;

        if (isTextStep) {
            if (stepIndex === 2) {
                el.textContent = ["Losuj", "Przemieść", "Zaatakuj", "Ulecz", "Obroń", "Okryj", "Pokaż", "Zniszcz"][index];
            } else if (stepIndex === 3) {
                el.textContent = ["Kreacja", "Dotyk", "Wybuch", "Plama", "Ściana", "Pocisk", "Iluzja", "Przywołanie"][index];
            } else {
                el.textContent = index === 0 ? '9' : `${index + 1}`;
            }
            el.style.backgroundImage = 'none';
        } else {
            el.textContent = '';
            el.style.backgroundImage = `url('./static/icons/icon_${index}_${iconStep}.png')`;
        }
    });
}

export function hideVertexIcons() {
    document.querySelectorAll('.vertex-icon').forEach(img => {
        img.classList.add('hidden');
    });
}

export function showVertexIcons() {
    document.querySelectorAll('.vertex-icon').forEach(img => {
        img.classList.remove('hidden');
    });
}
