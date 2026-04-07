const RADIATOR_TYPES = [
    { id: 'leaky', name: 'Leaky Radiator', rarity: 'Common', weight: 30, durability: 0.8 },
    { id: 'stock', name: 'Stock Radiator', rarity: 'Common', weight: 25, durability: 1.0 },
    { id: 'heavy_duty', name: 'Heavy-Duty Radiator', rarity: 'Uncommon', weight: 20, durability: 1.15 },
    { id: 'alloy', name: 'Alloy Radiator', rarity: 'Rare', weight: 13, durability: 1.25 },
    { id: 'racing', name: 'Racing Radiator', rarity: 'Very Rare', weight: 8, durability: 1.35 },
    { id: 'titanium', name: 'Titanium Radiator', rarity: 'Legendary', weight: 4, durability: 1.5 },
];

const RADIATOR_TOTAL_WEIGHT = RADIATOR_TYPES.reduce((s, r) => s + r.weight, 0);

const radiatorSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...RADIATOR_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getRadiatorForTile(tileX, tileY) {
        let roll = hash2(tileX * 4.1, tileY * 8.9, 1500) * RADIATOR_TOTAL_WEIGHT;
        for (const rad of RADIATOR_TYPES) {
            roll -= rad.weight;
            if (roll <= 0) return { ...rad };
        }
        return { ...RADIATOR_TYPES[0] };
    },

    showSwapUI(foundRadiator, entity) {
        this.pendingSwap = foundRadiator;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundRadiator;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        const arrow = (curVal, fndVal) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            return fndVal > curVal ? ['#4f4', '\u25B2'] : ['#f44', '\u25BC'];
        };

        const [dc, da] = arrow(cur.durability, fnd.durability);

        const panel = document.getElementById('radiatorSwapContent');
        panel.innerHTML =
            '<h2 style="color:#4488aa;margin:0 0 5px">Radiator Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center"><h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="margin:4px 0">Durability: ' + fontNumericHtml(Math.round(cur.durability * 100)) + '%</p></div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center"><h3 style="color:#4488aa;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + dc + ';margin:4px 0">Durability: ' + fontNumericHtml(Math.round(fnd.durability * 100)) + '% ' + da + '</p></div></div>' +
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
        if (typeof showNotification === 'function') showNotification('Kept current radiator.');
        this.hideSwapUI();
    },

    _updateSidebar() {
        const el = document.getElementById('radiatorText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'radiatorSwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:2500;display:none;align-items:center;justify-content:center;font-family:var(--font-ui),sans-serif;color:#ccc';
        const panel = document.createElement('div');
        panel.id = 'radiatorSwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #4488aa;border-radius:10px;padding:25px;text-align:center;min-width:350px';
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

    getSaveData() { return { radiatorId: this.current.id }; },

    loadSaveData(data) {
        if (data && data.radiatorId) {
            const rad = RADIATOR_TYPES.find(r => r.id === data.radiatorId);
            if (rad) { this.current = { ...rad }; this._updateSidebar(); }
        }
    },

    reset() {
        this.current = { ...RADIATOR_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
