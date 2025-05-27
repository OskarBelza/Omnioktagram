import {
    normalizePoint,
    getPointIndex,
    getActionColor,
    pointsEqual,
    getClosestPoint,
} from './utils.js';

import {
    clearCanvas,
    drawBaseLines,
    drawVertices,
    drawActions,
    drawTempLine
} from './canvasRender.js';

import {
    generatePointInfo,
    showHistory,
    loadSpellFromCode
} from './spellManager.js';

import {
    updateVertexIcons,
    updateThemeIcon,
    hideVertexIcons,
    showVertexIcons
} from './uiManager.js';

import {
    disableScroll,
    enableScroll,
    getEffectiveOffset
} from './inputHandler.js';

import { LOGIC_CONFIG } from './config.js';

export class OmnioktagramApp {
    constructor(canvasId, toggleThemeBtn) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.toggleThemeBtn = toggleThemeBtn;

        this.center = { x: 0, y: 0 };
        this.radius = 0;
        this.points = [];

        this.dragging = false;
        this.startPoint = null;
        this.currentMouse = { x: 0, y: 0 };
        this.lastEndPoint = null;
        this.lastTouchOffset = null;
        this.hasDragged = false;

        this.visitedPoints = [];
        this.actions = [];
        this.pointDataLog = [];
        this.totalManaCost = 0;
        this.spellCode = [];
        this.actionCount = 0;
        this.historyShown = false;

        this.ACTION_LIMIT = LOGIC_CONFIG.ACTION_LIMIT;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.postActionUpdate();
        updateThemeIcon(this.toggleThemeBtn);
        document.getElementById('history').innerHTML = `
            <div id="live-info-container" style="
                display: flex;
                justify-content: space-between;
                font-size: 1.6em;
                font-weight: bold;
                margin-bottom: 12px;
            ">
                <div id="mana-live-display">Koszt many: 0</div>
                <div id="step-title-display">Etap: NATURA</div>
            </div>`;

    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const cssSize = Math.min(rect.width, rect.height);

        this.canvas.width = cssSize * dpr;
        this.canvas.height = cssSize * dpr;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        this.center = { x: cssSize / 2, y: cssSize / 2 };
        this.radius = cssSize * LOGIC_CONFIG.RADIUS_SCALE;

        this.points = Array.from({ length: LOGIC_CONFIG.POINT_COUNT }, (_, i) => {
            const angle = (Math.PI / 4) * i - Math.PI / 2;
            return {
                x: this.center.x + this.radius * Math.cos(angle),
                y: this.center.y + this.radius * Math.sin(angle)
            };
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.postActionUpdate();
        });

        ['mousedown', 'touchstart'].forEach(evt => this.canvas.addEventListener(evt, e => this.onDown(e)));
        ['mousemove', 'touchmove'].forEach(evt => this.canvas.addEventListener(evt, e => this.onMove(e)));
        ['mouseup', 'touchend'].forEach(evt => this.canvas.addEventListener(evt, e => this.onUp(e)));

        this.toggleThemeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            updateThemeIcon(this.toggleThemeBtn);
            this.draw();
        });
    }

    draw() {
        clearCanvas(this.ctx, this.canvas);
        drawBaseLines(this.ctx, this.points, this.center, this.radius);
        drawActions(this.ctx, this.actions, this.points, this.radius);
        drawVertices(this.ctx, this.points, this.radius);
        drawTempLine(this.ctx, this.dragging, this.startPoint, this.currentMouse, this.actions, this.radius);
    }

    postActionUpdate() {
        this.draw();
        updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);

        if (this.actionCount >= this.ACTION_LIMIT && !this.historyShown) {
            this.showHistory();
            this.finalizeDrawing();
            this.historyShown = true;
        }
    }

    resetState() {
        this.visitedPoints = [];
        this.actions = [];
        this.pointDataLog = [];
        this.spellCode = [];
        this.actionCount = 0;
        this.totalManaCost = 0;
        this.historyShown = false;
        this.lastEndPoint = null;
        this.startPoint = null;
        this.dragging = false;
        this.currentMouse = { x: 0, y: 0 };

        document.getElementById('history').innerHTML = `
            <div id="live-info-container" style="
                display: flex;
                justify-content: space-between;
                font-size: 1.6em;
                font-weight: bold;
                margin-bottom: 12px;
            ">
                <div id="mana-live-display">Koszt many: 0</div>
                <div id="step-title-display">Etap: Natura</div>
            </div>`;

        showVertexIcons();

        this.updateManaLiveDisplay();
        this.updateStepTitleDisplay();
        this.postActionUpdate();
    }

    finalizeDrawing() {
        this.actions.forEach(action => action.color = 'black');
        hideVertexIcons();
        this.draw();
    }

    showHistory() {
        const historyDiv = document.getElementById('history');
        showHistory(historyDiv, this.pointDataLog, this.totalManaCost, this.spellCode);
    }

    loadSpellFromCode(code) {
        this.resetState();

        loadSpellFromCode(code, this, this.points, getActionColor, step => {
            updateVertexIcons(step, this.points, this.canvas, this.radius);
        });

        this.showHistory();
        this.finalizeDrawing();
        this.historyShown = true;
    }
    updateManaLiveDisplay() {
        const el = document.getElementById('mana-live-display');
        if (el) {
            el.textContent = `Koszt many: ${this.totalManaCost}`;
        }
    }

    updateStepTitleDisplay() {
    const el = document.getElementById('step-title-display');
        if (el) {
            const titles = LOGIC_CONFIG.STEP_TITLES
            const title = titles[this.actionCount] ?? '';
            el.textContent = `Etap: ${title}`;
        }
    }


    addAction(type, pt, fromPt = null, spellValue = null, infoOverride = null) {
        const color = getActionColor(this.actionCount);
        const index = getPointIndex(pt, this.points);
        const infoSet = generatePointInfo(this.actionCount);

        if (index !== -1) {
            const manaCost = spellValue ?? (index === 0 ? 8 : index);
            this.totalManaCost += manaCost;
            this.spellCode.push(manaCost);
            this.pointDataLog.push({ point: pt, info: infoOverride ?? infoSet[index] });
        }

        if (type === 'line') {
            this.actions.push({ type: 'line', from: normalizePoint(fromPt, this.canvas), to: normalizePoint(pt, this.canvas), color });
            this.lastEndPoint = pt;
        } else {
            this.actions.push({ type, point: normalizePoint(pt, this.canvas), color });
            this.lastEndPoint = pt;
        }

        this.visitedPoints.push(pt);
        this.actionCount++;
        this.updateManaLiveDisplay();
        this.updateStepTitleDisplay();
    }

    onDown(e) {
        e.preventDefault();
        disableScroll(this.canvas);
        const { offsetX, offsetY } = getEffectiveOffset(e, this.lastTouchOffset, this.canvas);
        this.hasDragged = false;

        const isFirstAction = this.actionCount === 0;
        const threshold = this.radius * LOGIC_CONFIG.START_THRESHOLD_SCALE;

        const pt = getClosestPoint(offsetX, offsetY, this.points, threshold, candidate => {
            return isFirstAction ? candidate === this.points[0] : pointsEqual(candidate, this.lastEndPoint);
        });

        if (pt) {
            this.startPoint = pt;
            this.dragging = true;
        }
    }

    onMove(e) {
        if (!this.dragging) return;
        e.preventDefault();
        this.hasDragged = true;

        const { offsetX, offsetY } = getEffectiveOffset(e, this.lastTouchOffset, this.canvas);
        this.currentMouse = { x: offsetX, y: offsetY };

        if (e.touches && e.touches.length > 0) {
            this.lastTouchOffset = { offsetX, offsetY };
        }

        this.draw();
    }

    onUp(e) {
        e.preventDefault();
        enableScroll(this.canvas);

        const { offsetX, offsetY } = getEffectiveOffset(e, this.lastTouchOffset, this.canvas);

        if (!this.dragging || !this.startPoint) {
            this.dragging = false;
            this.startPoint = null;
            return;
        }

        this.dragging = false;

        if (!this.hasDragged) {
            this.handleTap(offsetX, offsetY);
            this.startPoint = null;
            return;
        }

        if (this.actionCount >= this.ACTION_LIMIT) {
            this.startPoint = null;
            this.draw();
            return;
        }

        const pt = getClosestPoint(offsetX, offsetY, this.points, this.radius * LOGIC_CONFIG.END_THRESHOLD_SCALE,
                candidate => !pointsEqual(candidate, this.startPoint));
        if (pt) {
            this.addAction('line', pt, this.startPoint);
        }

        this.startPoint = null;
        this.postActionUpdate();
    }

    handleTap(offsetX, offsetY) {
        if (this.actionCount >= this.ACTION_LIMIT) return;

        const isFirstAction = this.actionCount === 0;
        const allowedTapPoint = isFirstAction ? this.points[0] : this.lastEndPoint;
        if (!allowedTapPoint) return;

        const pt = getClosestPoint(offsetX, offsetY, this.points, this.radius * LOGIC_CONFIG.TAP_THRESHOLD_SCALE,
                candidate => pointsEqual(candidate, allowedTapPoint));
        if (pt) {
            this.addAction('marker', pt);
            this.postActionUpdate();
        }
    }

    skipAction() {
        if (this.actionCount >= this.ACTION_LIMIT || this.historyShown) return;
        if (this.actionCount < LOGIC_CONFIG.MIN_ACTIONS_FOR_SKIP) {
            alert("Aby pominąć, musisz najpierw wykonać co najmniej 4 akcje.");
            return;
        }

        if (this.lastEndPoint) {
            const index = getPointIndex(this.lastEndPoint, this.points);
            const infoSet = generatePointInfo(this.actionCount);

            if (index !== -1) {
                this.addAction('skip', this.lastEndPoint, null, 0, infoSet[8]);
            }
        }
        this.postActionUpdate();
    }
}
