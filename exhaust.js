const EXHAUST_TYPES = [
    { id: 'rusted', name: 'Rusted Exhaust', rarity: 'Common', weight: 30, power: 0.85 },
    { id: 'stock', name: 'Stock Exhaust', rarity: 'Common', weight: 25, power: 1.0 },
    { id: 'sport', name: 'Sport Exhaust', rarity: 'Uncommon', weight: 20, power: 1.1 },
    { id: 'performance', name: 'Performance Exhaust', rarity: 'Rare', weight: 13, power: 1.2 },
    { id: 'racing', name: 'Racing Exhaust', rarity: 'Very Rare', weight: 8, power: 1.3 },
    { id: 'turbo_back', name: 'Turbo-Back System', rarity: 'Legendary', weight: 4, power: 1.4 },
];

const EXHAUST_TOTAL_WEIGHT = EXHAUST_TYPES.reduce((s, e) => s + e.weight, 0);

const exhaustSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...EXHAUST_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getExhaustForTile(tileX, tileY) {
        let roll = hash2(tileX * 2.9, tileY * 6.1, 1400) * EXHAUST_TOTAL_WEIGHT;
        for (const ex of EXHAUST_TYPES) {
            roll -= ex.weight;
            if (roll <= 0) return { ...ex };
        }
        return { ...EXHAUST_TYPES[0] };
    },

    showSwapUI(foundExhaust, entity) {
        this.pendingSwap = foundExhaust;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundExhaust;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        const arrow = (curVal, fndVal) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            return fndVal > curVal ? ['#4f4', '\u25B2'] : ['#f44', '\u25BC'];
        };

        const [pc, pa] = arrow(cur.power, fnd.power);

        const panel = document.getElementById('exhaustSwapContent');
        panel.innerHTML =
            '<h2 style="color:#8a6644;margin:0 0 5px">Exhaust Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center"><h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="margin:4px 0">Power: ' + fontNumericHtml(Math.round(cur.power * 100)) + '%</p></div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center"><h3 style="color:#8a6644;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + pc + ';margin:4px 0">Power: ' + fontNumericHtml(Math.round(fnd.power * 100)) + '% ' + pa + '</p></div></div>' +
            '<p style="margin-top:14px;color:#a33;font-size:11px">Swapping is permanent.</p>' +
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
        if (typeof showNotification === 'function') showNotification('Installed ' + this.current.name + '!');
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') showNotification('Kept current exhaust.');
        this.hideSwapUI();
    },

    _updateSidebar() {
        const el = document.getElementById('exhaustText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'exhaustSwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:2500;display:none;align-items:center;justify-content:center;font-family:var(--font-ui),sans-serif;color:#ccc';
        const panel = document.createElement('div');
        panel.id = 'exhaustSwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #8a6644;border-radius:10px;padding:25px;text-align:center;min-width:350px';
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.overlayEl = overlay;
        bindSwapModalOverlayClicks(overlay, this);
    },

    _bindKeys() {
        window.addEventListener('keydown', (e) => {
            if (!this.pendingSwap) return;
            if (e.key.toLowerCase() === 'e') { e.preventDefault(); this.acceptSwap(); }
            else if (e.key === 'Escape') { e.preventDefault(); this.declineSwap(); }
        });
    },

    getSaveData() { return { exhaustId: this.current.id }; },

    loadSaveData(data) {
        if (data && data.exhaustId) {
            const ex = EXHAUST_TYPES.find(e => e.id === data.exhaustId);
            if (ex) { this.current = { ...ex }; this._updateSidebar(); }
        }
    },

    reset() {
        this.current = { ...EXHAUST_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
