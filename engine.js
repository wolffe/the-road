const ENGINE_TYPES = [
    { id: 'rusty_2cyl', name: 'Rusty 2-Cylinder', rarity: 'Common', weight: 30, power: 0.6, fuelRate: 1.3 },
    { id: 'stock_4cyl', name: 'Stock 4-Cylinder', rarity: 'Common', weight: 25, power: 1.0, fuelRate: 1.0 },
    { id: 'tuned_4cyl', name: 'Tuned 4-Cylinder', rarity: 'Uncommon', weight: 20, power: 1.2, fuelRate: 1.1 },
    { id: 'v6', name: 'V6 Engine', rarity: 'Rare', weight: 13, power: 1.4, fuelRate: 1.25 },
    { id: 'v8', name: 'V8 Engine', rarity: 'Very Rare', weight: 8, power: 1.65, fuelRate: 1.4 },
    { id: 'turbo_v8', name: 'Turbo V8', rarity: 'Legendary', weight: 4, power: 2.0, fuelRate: 1.6 },
];

const ENGINE_TOTAL_WEIGHT = ENGINE_TYPES.reduce((s, e) => s + e.weight, 0);

const engineSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...ENGINE_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getEngineForTile(tileX, tileY) {
        let roll = hash2(tileX * 3.7, tileY * 7.3, 1100) * ENGINE_TOTAL_WEIGHT;
        for (const engine of ENGINE_TYPES) {
            roll -= engine.weight;
            if (roll <= 0) return { ...engine };
        }
        return { ...ENGINE_TYPES[0] };
    },

    showSwapUI(foundEngine, entity) {
        this.pendingSwap = foundEngine;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundEngine;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        const arrow = (curVal, fndVal, lowerBetter) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            const better = lowerBetter ? fndVal < curVal : fndVal > curVal;
            return better ? ['#4f4', '\u25B2'] : ['#f44', '\u25BC'];
        };

        const [pc, pa] = arrow(cur.power, fnd.power, false);
        const [fc, fa] = arrow(cur.fuelRate, fnd.fuelRate, true);

        const panel = document.getElementById('engineSwapContent');
        panel.innerHTML =
            '<h2 style="color:#4488aa;margin:0 0 5px">Engine Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center">' +
            '<h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="color:' + curColor + ';font-size:11px;margin:2px 0">' + cur.rarity + '</p>' +
            '<p style="margin:4px 0">Power: ' + fontNumericHtml(Math.round(cur.power * 100)) + '%</p>' +
            '<p style="margin:4px 0">Fuel use: ' + fontNumericHtml(Math.round(cur.fuelRate * 100)) + '%</p>' +
            '</div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center">' +
            '<h3 style="color:#4488aa;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + fndColor + ';font-size:11px;margin:2px 0">' + fnd.rarity + '</p>' +
            '<p style="color:' + pc + ';margin:4px 0">Power: ' + fontNumericHtml(Math.round(fnd.power * 100)) + '% ' + pa + '</p>' +
            '<p style="color:' + fc + ';margin:4px 0">Fuel use: ' + fontNumericHtml(Math.round(fnd.fuelRate * 100)) + '% ' + fa + '</p>' +
            '</div>' +
            '</div>' +
            '<p style="margin-top:14px;color:#a33;font-size:11px">Swapping is permanent - your current engine will be lost.</p>' +
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
        if (typeof playIconPickupSound === 'function') playIconPickupSound();
        this.current = this.pendingSwap;
        if (this.pendingEntity) {
            this.pendingEntity.active = false;
            if (typeof gameState !== 'undefined') {
                gameState.collectedTiles.add(`${this.pendingEntity.tileX},${this.pendingEntity.tileY}`);
            }
        }
        this._updateSidebar();
        if (typeof showNotification === 'function') {
            showNotification('Installed ' + this.current.name + '! (' + this.current.rarity + ')');
        }
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') {
            showNotification('Kept current engine.');
        }
        this.hideSwapUI();
    },

    _updateSidebar() {
        const el = document.getElementById('engineText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'engineSwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.7);z-index:2500;display:none;' +
            'align-items:center;justify-content:center;font-family:var(--font-ui),sans-serif;color:#ccc';

        const panel = document.createElement('div');
        panel.id = 'engineSwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #4488aa;' +
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
        return { engineId: this.current.id };
    },

    loadSaveData(data) {
        if (data && data.engineId) {
            const engine = ENGINE_TYPES.find(e => e.id === data.engineId);
            if (engine) {
                this.current = { ...engine };
                this._updateSidebar();
            }
        }
    },

    reset() {
        this.current = { ...ENGINE_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
