/** Game speed units: multiply by 50 for approximate km/h in the HUD. */
const CAR_TYPES = [
    { id: 'lada_vaz', name: 'Lada / VAZ', rarity: 'Common', weight: 26, speed: 0.92, topSpeed: 1.82, armor: 0.95, steering: 1.0, mass: 1.0, width: 20, length: 40, sprite: null, color: '#6a7a88' },
    { id: 'gaz_24', name: 'GAZ-24 Volga', rarity: 'Common', weight: 24, speed: 0.95, topSpeed: 1.92, armor: 1.0, steering: 0.98, mass: 1.05, width: 21, length: 42, sprite: null, color: '#4a5562' },
    { id: 'uaz_469', name: 'UAZ-469', rarity: 'Common', weight: 20, speed: 0.9, topSpeed: 1.76, armor: 1.1, steering: 0.95, mass: 1.05, width: 20, length: 38, sprite: null, color: '#4a5a38' },
    { id: 'toyota_hilux_1973', name: '1973 Toyota Hilux', rarity: 'Uncommon', weight: 16, speed: 1.0, topSpeed: 2.08, armor: 1.05, steering: 1.0, mass: 1.0, width: 20, length: 40, sprite: null, color: '#c4a060' },
    { id: 'van_soviet', name: 'Soviet van', rarity: 'Uncommon', weight: 14, speed: 0.78, topSpeed: 1.66, armor: 0.95, steering: 0.75, mass: 1.35, width: 22, length: 38, sprite: null, color: '#8a8a6a' },
    { id: 'gaz_66', name: 'GAZ-66', rarity: 'Rare', weight: 12, speed: 0.72, topSpeed: 1.48, armor: 1.25, steering: 0.65, mass: 1.6, width: 24, length: 50, sprite: null, color: '#556648' },
    { id: 'ural', name: 'Ural 4320', rarity: 'Rare', weight: 10, speed: 0.62, topSpeed: 1.18, armor: 1.55, steering: 0.5, mass: 2.2, width: 30, length: 68, sprite: null, color: '#4a4a3a' },
    { id: 'renault_vab_1976', name: '1976 Renault VAB', rarity: 'Rare', weight: 8, speed: 0.82, topSpeed: 1.74, armor: 1.45, steering: 0.7, mass: 1.75, width: 24, length: 46, sprite: null, color: '#5a5a44' },
    { id: 'liaz_bus', name: 'City bus', rarity: 'Rare', weight: 7, speed: 0.68, topSpeed: 1.52, armor: 1.35, steering: 0.48, mass: 1.95, width: 26, length: 58, sprite: null, color: '#aa8833' },
];

const CAR_TOTAL_WEIGHT = CAR_TYPES.reduce((s, c) => s + c.weight, 0);

const LEGACY_CAR_ID_MAP = {
    rusty_sedan: 'lada_vaz',
    sedan: 'gaz_24',
    sport: 'toyota_hilux_1973',
    police: 'uaz_469',
    muscle: 'ural',
    rally: 'ural',
    school_bus: 'liaz_bus',
    truck: 'ural',
};

const carSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...CAR_TYPES[0] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getCarForTile(tileX, tileY) {
        let roll = applyReputationPickupRoll(
            hash2(tileX * 7.1, tileY * 13.3, 1300) * CAR_TOTAL_WEIGHT,
            CAR_TOTAL_WEIGHT
        );
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

        let partTop = 1;
        if (typeof engineSystem !== 'undefined' && engineSystem.current) {
            partTop *= engineSystem.current.power || 1;
        }
        if (typeof tireSystem !== 'undefined' && tireSystem.current) {
            partTop *= tireSystem.current.speed || 1;
        }
        if (typeof exhaustSystem !== 'undefined' && exhaustSystem.current) {
            partTop *= exhaustSystem.current.power || 1;
        }
        const curBase = cur.topSpeed != null && cur.topSpeed > 0 ? cur.topSpeed : 2;
        const fndBase = fnd.topSpeed != null && fnd.topSpeed > 0 ? fnd.topSpeed : 2;
        const curTopKmh = Math.round(curBase * partTop * 50);
        const fndTopKmh = Math.round(fndBase * partTop * 50);
        const [tc, ta] = arrow(curTopKmh, fndTopKmh);

        const panel = document.getElementById('carSwapContent');
        panel.innerHTML =
            '<h2 style="color:#cc6644;margin:0 0 5px">Vehicle Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center">' +
            '<h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="color:' + curColor + ';font-size:11px;margin:2px 0">' + cur.rarity + '</p>' +
            '<p style="margin:4px 0">Accel: ' + fontNumericHtml(Math.round(cur.speed * 100)) + '%</p>' +
            '<p style="margin:4px 0">Top: ' + fontNumericHtml(curTopKmh) + ' km/h</p>' +
            '<p style="margin:4px 0">Armor: ' + fontNumericHtml(Math.round(cur.armor * 100)) + '%</p>' +
            '<p style="margin:4px 0">Handling: ' + fontNumericHtml(Math.round(cur.steering * 100)) + '%</p>' +
            '<p style="margin:4px 0">Weight: ' + fontNumericHtml(Math.round(cur.mass * 100)) + '%</p>' +
            '</div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center">' +
            '<h3 style="color:#cc6644;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + fndColor + ';font-size:11px;margin:2px 0">' + fnd.rarity + '</p>' +
            statLine('Accel', fnd.speed, sc, sa) +
            '<p style="color:' + tc + ';margin:4px 0">Top: ' + fontNumericHtml(fndTopKmh) + ' km/h ' + ta + '</p>' +
            statLine('Armor', fnd.armor, ac, aa) +
            statLine('Handling', fnd.steering, hc, ha) +
            statLine('Weight', fnd.mass, wc, wa) +
            '</div>' +
            '</div>' +
            '<p style="margin-top:8px;color:#888;font-size:11px">Top speed uses your current engine, tires, and exhaust.</p>' +
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
        if (typeof reputationSystem !== 'undefined') reputationSystem.addRep(3);
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') {
            showNotification('Kept current vehicle.');
        }
        this.hideSwapUI();
    },

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
            let id = data.carId;
            if (LEGACY_CAR_ID_MAP[id]) id = LEGACY_CAR_ID_MAP[id];
            const car = CAR_TYPES.find(c => c.id === id);
            if (car) {
                this.current = { ...car };
                this._applyDimensions();
                this._updateSidebar();
            }
        }
    },

    /**
     * Dev/testing only: `?vehicle=van_soviet` (any `CAR_TYPES` id, or legacy id from LEGACY_CAR_ID_MAP).
     * Call after init/load/reset so it overrides save and default Lada.
     */
    applyVehicleQueryParam() {
        try {
            const raw = new URLSearchParams(window.location.search).get('vehicle');
            if (!raw) return;
            let id = String(raw).trim().toLowerCase();
            if (!id) return;
            if (LEGACY_CAR_ID_MAP[id]) id = LEGACY_CAR_ID_MAP[id];
            const car = CAR_TYPES.find(c => c.id === id);
            if (!car) return;
            this.current = { ...car };
            this._applyDimensions();
            this._updateSidebar();
        } catch (e) {
            /* ignore */
        }
    },

    reset() {
        this.current = { ...CAR_TYPES[0] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        this._applyDimensions();
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
