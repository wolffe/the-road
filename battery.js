const BATTERY_TYPES = [
    { id: 'weak', name: 'Weak Battery', rarity: 'Common', weight: 30, efficiency: 0.8 },
    { id: 'stock', name: 'Stock Battery', rarity: 'Common', weight: 25, efficiency: 1.0 },
    { id: 'heavy_duty', name: 'Heavy-Duty Battery', rarity: 'Uncommon', weight: 20, efficiency: 1.15 },
    { id: 'gel', name: 'Gel Cell Battery', rarity: 'Rare', weight: 13, efficiency: 1.25 },
    { id: 'lithium', name: 'Lithium Battery', rarity: 'Very Rare', weight: 8, efficiency: 1.4 },
    { id: 'capacitor', name: 'Capacitor Bank', rarity: 'Legendary', weight: 4, efficiency: 1.6 },
];

const BATTERY_TOTAL_WEIGHT = BATTERY_TYPES.reduce((s, b) => s + b.weight, 0);

const batterySystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...BATTERY_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getBatteryForTile(tileX, tileY) {
        let roll = hash2(tileX * 6.7, tileY * 3.2, 1600) * BATTERY_TOTAL_WEIGHT;
        for (const bat of BATTERY_TYPES) {
            roll -= bat.weight;
            if (roll <= 0) return { ...bat };
        }
        return { ...BATTERY_TYPES[0] };
    },

    showSwapUI(foundBattery, entity) {
        this.pendingSwap = foundBattery;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundBattery;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        const arrow = (curVal, fndVal) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            return fndVal > curVal ? ['#4f4', '\u25B2'] : ['#f44', '\u25BC'];
        };

        const [ec, ea] = arrow(cur.efficiency, fnd.efficiency);

        const panel = document.getElementById('batterySwapContent');
        panel.innerHTML =
            '<h2 style="color:#88aa44;margin:0 0 5px">Battery Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center"><h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="margin:4px 0">Efficiency: ' + Math.round(cur.efficiency * 100) + '%</p></div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center"><h3 style="color:#88aa44;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + ec + ';margin:4px 0">Efficiency: ' + Math.round(fnd.efficiency * 100) + '% ' + ea + '</p></div></div>' +
            '<p style="margin-top:14px;color:#a33;font-size:11px">Swapping is permanent.</p>' +
            '<p style="margin-top:10px;color:#888;font-size:12px">Press <span style="color:#4f4">E</span> to Swap | <span style="color:#f44">Escape</span> to Keep</p>';

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
        this._updateSidebar();
        if (typeof showNotification === 'function') showNotification('Installed ' + this.current.name + '!');
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') showNotification('Kept current battery.');
        this.hideSwapUI();
    },

    _updateSidebar() {
        const el = document.getElementById('batteryPartText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'batterySwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:2500;display:none;align-items:center;justify-content:center;font-family:monospace;color:#ccc';
        const panel = document.createElement('div');
        panel.id = 'batterySwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #88aa44;border-radius:10px;padding:25px;text-align:center;min-width:350px';
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this.overlayEl = overlay;
    },

    _bindKeys() {
        window.addEventListener('keydown', (e) => {
            if (!this.pendingSwap) return;
            if (e.key.toLowerCase() === 'e') { e.preventDefault(); this.acceptSwap(); }
            else if (e.key === 'Escape') { e.preventDefault(); this.declineSwap(); }
        });
    },

    getSaveData() { return { batteryId: this.current.id }; },

    loadSaveData(data) {
        if (data && data.batteryId) {
            const bat = BATTERY_TYPES.find(b => b.id === data.batteryId);
            if (bat) { this.current = { ...bat }; this._updateSidebar(); }
        }
    },

    reset() {
        this.current = { ...BATTERY_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
