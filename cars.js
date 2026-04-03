const CAR_TYPES = [
    { id: 'rusty_sedan', name: 'Rusty Sedan', rarity: 'Common', weight: 30, speed: 0.9, armor: 0.8, steering: 1.0, mass: 1.0, width: 20, length: 38, sprite: 'car_rusty_sedan', color: '#886644' },
    { id: 'sedan', name: 'Standard Sedan', rarity: 'Common', weight: 25, speed: 1.0, armor: 1.0, steering: 1.0, mass: 1.0, width: 20, length: 40, sprite: 'car_sedan', color: '#ff0000' },
    { id: 'sport', name: 'Sport Coupe', rarity: 'Uncommon', weight: 20, speed: 1.15, armor: 0.85, steering: 1.2, mass: 0.9, width: 18, length: 38, sprite: null, color: '#2255cc' },
    { id: 'police', name: 'Police Interceptor', rarity: 'Rare', weight: 13, speed: 1.2, armor: 1.15, steering: 1.1, mass: 1.1, width: 20, length: 42, sprite: 'car_police', color: '#1a1a2e' },
    { id: 'muscle', name: 'Muscle Car', rarity: 'Very Rare', weight: 8, speed: 1.3, armor: 0.9, steering: 0.9, mass: 1.2, width: 22, length: 44, sprite: null, color: '#222222' },
    { id: 'rally', name: 'Rally Car', rarity: 'Legendary', weight: 4, speed: 1.15, armor: 1.3, steering: 1.15, mass: 0.95, width: 20, length: 40, sprite: null, color: '#ddaa00' },
    { id: 'school_bus', name: 'School Bus', rarity: 'Rare', weight: 10, speed: 0.7, armor: 1.5, steering: 0.5, mass: 2.0, width: 26, length: 58, sprite: null, color: '#ddaa22' },
    { id: 'truck', name: 'Heavy Truck', rarity: 'Very Rare', weight: 6, speed: 0.6, armor: 2.0, steering: 0.4, mass: 2.5, width: 28, length: 64, sprite: null, color: '#556655' },
];

const CAR_TOTAL_WEIGHT = CAR_TYPES.reduce((s, c) => s + c.weight, 0);

const carSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...CAR_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getCarForTile(tileX, tileY) {
        let roll = hash2(tileX * 7.1, tileY * 13.3, 1300) * CAR_TOTAL_WEIGHT;
        for (const car of CAR_TYPES) {
            roll -= car.weight;
            if (roll <= 0) return { ...car };
        }
        return { ...CAR_TYPES[0] };
    },

    showSwapUI(foundCar, entity) {
        this.pendingSwap = foundCar;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundCar;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        // Arrow indicator: color reflects good/bad, symbol reflects direction
        const arrow = (curVal, fndVal, lowerBetter = false) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            const higher = fndVal > curVal;
            const better = lowerBetter ? !higher : higher;
            return [better ? '#4f4' : '#f44', higher ? '\u25B2' : '\u25BC'];
        };

        const [sc, sa] = arrow(cur.speed, fnd.speed);
        const [ac, aa] = arrow(cur.armor, fnd.armor);
        const [hc, ha] = arrow(cur.steering, fnd.steering);
        const [wc, wa] = arrow(cur.mass, fnd.mass, true);

        const statLine = (label, val, col, sym) =>
            '<p style="color:' + col + ';margin:4px 0">' + label + ': ' + fontNumericHtml(Math.round(val * 100)) + '% ' + sym + '</p>';

        const panel = document.getElementById('carSwapContent');
        panel.innerHTML =
            '<h2 style="color:#cc6644;margin:0 0 5px">Vehicle Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center">' +
            '<h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="color:' + curColor + ';font-size:11px;margin:2px 0">' + cur.rarity + '</p>' +
            '<p style="margin:4px 0">Speed: ' + fontNumericHtml(Math.round(cur.speed * 100)) + '%</p>' +
            '<p style="margin:4px 0">Armor: ' + fontNumericHtml(Math.round(cur.armor * 100)) + '%</p>' +
            '<p style="margin:4px 0">Handling: ' + fontNumericHtml(Math.round(cur.steering * 100)) + '%</p>' +
            '<p style="margin:4px 0">Weight: ' + fontNumericHtml(Math.round(cur.mass * 100)) + '%</p>' +
            '</div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center">' +
            '<h3 style="color:#cc6644;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + fndColor + ';font-size:11px;margin:2px 0">' + fnd.rarity + '</p>' +
            statLine('Speed', fnd.speed, sc, sa) +
            statLine('Armor', fnd.armor, ac, aa) +
            statLine('Handling', fnd.steering, hc, ha) +
            statLine('Weight', fnd.mass, wc, wa) +
            '</div>' +
            '</div>' +
            '<p style="margin-top:14px;color:#a33;font-size:11px">Swapping is permanent \u2014 your current vehicle will be lost.</p>' +
            SWAP_MODAL_ACTIONS_HTML;

        this.overlayEl.style.display = 'flex';
    },

    hideSwapUI() {
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.overlayEl.style.display = 'none';
    },

    acceptSwap() {
        if (!this.pendingSwap) return;
        this.current = this.pendingSwap;
        if (this.pendingEntity) {
            this.pendingEntity.active = false;
            if (typeof gameState !== 'undefined') {
                gameState.collectedTiles.add(`${this.pendingEntity.tileX},${this.pendingEntity.tileY}`);
            }
        }
        this._applyDimensions();
        this._updateSidebar();
        if (typeof showNotification === 'function') {
            showNotification('Switched to ' + this.current.name + '! (' + this.current.rarity + ')');
        }
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') {
            showNotification('Kept current vehicle.');
        }
        this.hideSwapUI();
    },

    // Syncs car dimensions to gameState so physics, rendering, and particles all adapt
    _applyDimensions() {
        if (typeof gameState !== 'undefined') {
            gameState.car.width = this.current.width;
            gameState.car.length = this.current.length;
        }
    },

    _updateSidebar() {
        const el = document.getElementById('carText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'carSwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.7);z-index:2500;display:none;' +
            'align-items:center;justify-content:center;font-family:var(--font-ui),sans-serif;color:#ccc';

        const panel = document.createElement('div');
        panel.id = 'carSwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #cc6644;' +
            'border-radius:10px;padding:25px;text-align:center;min-width:350px';

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.overlayEl = overlay;
        bindSwapModalOverlayClicks(overlay, this);
    },

    _bindKeys() {
        window.addEventListener('keydown', (e) => {
            if (!this.pendingSwap) return;
            if (e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.acceptSwap();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.declineSwap();
            }
        });
    },

    getSaveData() {
        return { carId: this.current.id };
    },

    loadSaveData(data) {
        if (data && data.carId) {
            const car = CAR_TYPES.find(c => c.id === data.carId);
            if (car) {
                this.current = { ...car };
                this._applyDimensions();
                this._updateSidebar();
            }
        }
    },

    reset() {
        this.current = { ...CAR_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        this._applyDimensions();
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
