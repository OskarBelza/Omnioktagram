import {
    normalizePoint,
    denormalizePoint,
    getPointIndex,
    getActionColor
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
    getEventOffset,
    disableScroll,
    enableScroll
} from './inputHandler.js';

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

        this.ACTION_LIMIT = 8;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.draw();
        updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);
        updateThemeIcon(this.toggleThemeBtn);
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
        this.radius = cssSize * 0.34;

        this.points = Array.from({ length: 8 }, (_, i) => {
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
            this.draw();
            updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);
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

        document.getElementById('history').innerHTML = '';
        showVertexIcons();

        this.draw();
        updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);
    }

    finalizeDrawing() {
        this.actions.forEach(action => {
            action.color = 'black';
        });

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
    }

    checkActionLimit() {
        if (this.actionCount >= this.ACTION_LIMIT && !this.historyShown) {
            this.showHistory();
            this.finalizeDrawing();
            this.historyShown = true;
        }
    }

    onDown(e) {
        e.preventDefault();
        disableScroll(this.canvas);
        const { offsetX, offsetY } = getEventOffset(e, this.canvas);
        this.hasDragged = false;

        const isFirstAction = this.actionCount === 0;
        const threshold = this.radius * 0.70;

        for (const pt of this.points) {
            const dx = pt.x - offsetX;
            const dy = pt.y - offsetY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const isStartAllowed = isFirstAction
                ? pt === this.points[0]
                : (!this.lastEndPoint || (pt.x === this.lastEndPoint.x && pt.y === this.lastEndPoint.y));

            if (distance < threshold && isStartAllowed) {
                this.startPoint = pt;
                this.dragging = true;
                break;
            }
        }
    }

    onMove(e) {
        if (!this.dragging) return;
        e.preventDefault();
        this.hasDragged = true;

        const { offsetX, offsetY } = getEventOffset(e, this.canvas);
        this.currentMouse = { x: offsetX, y: offsetY };

        if (e.touches && e.touches.length > 0) {
            this.lastTouchOffset = { offsetX, offsetY };
        }

        this.draw();
    }

    onUp(e) {
        e.preventDefault();
        enableScroll(this.canvas);
        if (!this.dragging || !this.startPoint) return;

        this.dragging = false;

        let offsetX, offsetY;
        if (e.type === 'touchend' && this.lastTouchOffset) {
            ({ offsetX, offsetY } = this.lastTouchOffset);
        } else {
            ({ offsetX, offsetY } = getEventOffset(e, this.canvas));
        }

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

        const threshold = this.radius * 0.20;
        for (const pt of this.points) {
            const dx = pt.x - offsetX;
            const dy = pt.y - offsetY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < threshold && (pt.x !== this.startPoint.x || pt.y !== this.startPoint.y)) {
                this.addAction('line', pt, this.startPoint);
                break;
            }
        }

        this.startPoint = null;
        this.draw();
        updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);

        if (this.actionCount >= this.ACTION_LIMIT && !this.historyShown) {
            this.showHistory();
            this.finalizeDrawing();
            this.historyShown = true;
        }
    }

    handleTap(offsetX, offsetY) {
        if (this.actionCount >= this.ACTION_LIMIT) return;

        const isFirstAction = this.actionCount === 0;
        const allowedTapPoint = isFirstAction ? this.points[0] : this.lastEndPoint;
        if (!allowedTapPoint) return;

        const threshold = this.radius * 0.70;
        for (const pt of this.points) {
            const dx = pt.x - offsetX;
            const dy = pt.y - offsetY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < threshold && pt.x === allowedTapPoint.x && pt.y === allowedTapPoint.y) {
                this.addAction('marker', pt);
                this.draw();
                updateVertexIcons(this.actionCount, this.points, this.canvas, this.radius);

                if (this.actionCount >= this.ACTION_LIMIT && !this.historyShown) {
                    this.showHistory();
                    this.finalizeDrawing();
                    this.historyShown = true;
                }
                break;
            }
        }
    }

    skipAction() {
        if (this.actionCount >= this.ACTION_LIMIT || this.historyShown) return;
        if (this.actionCount < 4) {
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

        if (this.actionCount >= this.ACTION_LIMIT && !this.historyShown) {
            this.showHistory();
            this.finalizeDrawing();
            this.historyShown = true;
        }

        this.draw();
    }
}
