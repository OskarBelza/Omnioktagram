export function getEffectiveOffset(e, lastTouchOffset, canvas) {
    if (e.type === 'touchend' && lastTouchOffset) {
        return lastTouchOffset;
    }
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            offsetX: e.touches[0].clientX - rect.left,
            offsetY: e.touches[0].clientY - rect.top
        };
    } else {
        return { offsetX: e.offsetX, offsetY: e.offsetY };
    }
}

export function preventDefault(e) {
    e.preventDefault();
}

export function disableScroll(canvas) {
    canvas.style.touchAction = 'none';
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
}

export function enableScroll(canvas) {
    canvas.style.touchAction = '';
    document.body.removeEventListener('touchmove', preventDefault);
}
