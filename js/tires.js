const TIRE_TYPES = [
    { id: 'worn', name: 'Worn Tires', rarity: 'Common', weight: 30, speed: 0.85, grip: 0.7 },
    { id: 'standard', name: 'Standard Tires', rarity: 'Common', weight: 25, speed: 1.0, grip: 1.0 },
    { id: 'sport', name: 'Sport Tires', rarity: 'Uncommon', weight: 20, speed: 1.08, grip: 0.9 },
    { id: 'offroad', name: 'Off-Road Tires', rarity: 'Rare', weight: 13, speed: 0.95, grip: 1.4 },
    { id: 'racing', name: 'Racing Slicks', rarity: 'Very Rare', weight: 8, speed: 1.12, grip: 0.75 },
    { id: 'rally', name: 'Rally Tires', rarity: 'Legendary', weight: 4, speed: 1.08, grip: 1.3 },
];

const TIRE_TOTAL_WEIGHT = TIRE_TYPES.reduce((s, t) => s + t.weight, 0);

const tireSystem = {
    current: null,
    pendingSwap: null,
    pendingEntity: null,
    lastDeclineTime: 0,
    overlayEl: null,

    init() {
        this.current = { ...TIRE_TYPES[1] };
        this._createOverlay();
        this._bindKeys();
        this._updateSidebar();
    },

    canInteract() {
        return !this.pendingSwap && Date.now() - this.lastDeclineTime > 2000;
    },

    getTireForTile(tileX, tileY) {
        let roll = applyReputationPickupRoll(
            hash2(tileX * 5.3, tileY * 11.7, 1200) * TIRE_TOTAL_WEIGHT,
            TIRE_TOTAL_WEIGHT
        );
        for (const tire of TIRE_TYPES) {
            roll -= tire.weight;
            if (roll <= 0) return { ...tire };
        }
        return { ...TIRE_TYPES[0] };
    },

    showSwapUI(foundTire, entity) {
        this.pendingSwap = foundTire;
        this.pendingEntity = entity;
        const cur = this.current;
        const fnd = foundTire;
        const fndColor = RARITY_COLORS[fnd.rarity] || '#aaa';
        const curColor = RARITY_COLORS[cur.rarity] || '#aaa';

        const arrow = (curVal, fndVal, lowerBetter) => {
            if (Math.abs(fndVal - curVal) < 0.01) return ['#aaa', '='];
            const better = lowerBetter ? fndVal < curVal : fndVal > curVal;
            return better ? ['#4f4', '\u25B2'] : ['#f44', '\u25BC'];
        };

        const [sc, sa] = arrow(cur.speed, fnd.speed, false);
        const [gc, ga] = arrow(cur.grip, fnd.grip, false);

        const panel = document.getElementById('tireSwapContent');
        panel.innerHTML =
            '<h2 style="color:#aa8844;margin:0 0 5px">Tires Found!</h2>' +
            '<p style="color:' + fndColor + ';margin:0 0 15px;font-size:12px">' + fnd.rarity + '</p>' +
            '<div style="display:flex;gap:30px;justify-content:center">' +
            '<div style="text-align:center">' +
            '<h3 style="color:#888;margin:0 0 8px">CURRENT</h3>' +
            '<p style="color:' + curColor + ';font-size:14px;margin:4px 0">' + cur.name + '</p>' +
            '<p style="color:' + curColor + ';font-size:11px;margin:2px 0">' + cur.rarity + '</p>' +
            '<p style="margin:4px 0">Speed: ' + fontNumericHtml(Math.round(cur.speed * 100)) + '%</p>' +
            '<p style="margin:4px 0">Grip: ' + fontNumericHtml(Math.round(cur.grip * 100)) + '%</p>' +
            '</div>' +
            '<div style="display:flex;align-items:center;font-size:24px;color:#666">\u2192</div>' +
            '<div style="text-align:center">' +
            '<h3 style="color:#aa8844;margin:0 0 8px">FOUND</h3>' +
            '<p style="color:' + fndColor + ';font-size:14px;margin:4px 0">' + fnd.name + '</p>' +
            '<p style="color:' + fndColor + ';font-size:11px;margin:2px 0">' + fnd.rarity + '</p>' +
            '<p style="color:' + sc + ';margin:4px 0">Speed: ' + fontNumericHtml(Math.round(fnd.speed * 100)) + '% ' + sa + '</p>' +
            '<p style="color:' + gc + ';margin:4px 0">Grip: ' + fontNumericHtml(Math.round(fnd.grip * 100)) + '% ' + ga + '</p>' +
            '</div>' +
            '</div>' +
            '<p style="margin-top:14px;color:#a33;font-size:11px">Swapping is permanent - your current tires will be lost.</p>' +
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
        if (typeof reputationSystem !== 'undefined') reputationSystem.addRep(2);
        this.hideSwapUI();
    },

    declineSwap() {
        this.lastDeclineTime = Date.now();
        if (typeof showNotification === 'function') {
            showNotification('Kept current tires.');
        }
        this.hideSwapUI();
    },

    _updateSidebar() {
        const el = document.getElementById('tireText');
        if (el) {
            el.textContent = this.current.name;
            el.style.color = RARITY_COLORS[this.current.rarity] || '#aaa';
        }
    },

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tireSwapOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.7);z-index:2500;display:none;' +
            'align-items:center;justify-content:center;font-family:var(--font-ui),sans-serif;color:#ccc';

        const panel = document.createElement('div');
        panel.id = 'tireSwapContent';
        panel.style.cssText = 'background:rgba(0,0,0,0.9);border:2px solid #aa8844;' +
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
        return { tireId: this.current.id };
    },

    loadSaveData(data) {
        if (data && data.tireId) {
            const tire = TIRE_TYPES.find(t => t.id === data.tireId);
            if (tire) {
                this.current = { ...tire };
                this._updateSidebar();
            }
        }
    },

    reset() {
        this.current = { ...TIRE_TYPES[1] };
        this.pendingSwap = null;
        this.pendingEntity = null;
        this.lastDeclineTime = 0;
        if (this.overlayEl) this.overlayEl.style.display = 'none';
        this._updateSidebar();
    }
};
