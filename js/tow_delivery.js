/**
 * Tow a wreck into structure ground (garage / parking / concrete) for scrap + rep.
 * Toggle: TOW_DELIVERY_ENABLED
 */
const TOW_DELIVERY_ENABLED = true;

const towDeliverySystem = {
    /** One payout per tow session until detach. */
    claimedThisTow: false,

    init() {
        this.claimedThisTow = false;
        this._updateUI();
    },

    onTowAttached() {
        if (!TOW_DELIVERY_ENABLED) return;
        this.claimedThisTow = false;
        this._updateUI();
    },

    onTowDetached() {
        this.claimedThisTow = false;
        this._updateUI();
    },

    /** Call from driving update while towing. */
    update() {
        if (!TOW_DELIVERY_ENABLED) return;
        if (typeof gameState === 'undefined' || !gameState.towing.active) return;
        if (this.claimedThisTow) return;

        const [tx, ty] = worldToTile(gameState.car.x, gameState.car.y);
        const terrain = getTerrainTypeAtTile(tx, ty);
        if (terrain === 'garage' || terrain === 'parking_lot' || terrain === 'concrete') {
            this._grantReward();
        }
    },

    _grantReward() {
        this.claimedThisTow = true;
        const bonus = 35 + Math.floor(Math.random() * 75);
        const car = gameState.car;
        car.trunk = Math.min(car.maxTrunk, car.trunk + bonus);
        if (typeof showNotification === 'function') {
            showNotification('Tow delivered: +' + bonus + ' scrap');
        }
        if (typeof reputationSystem !== 'undefined') {
            reputationSystem.addRep(4);
        }
        this._updateUI();
    },

    _updateUI() {
        const el = document.getElementById('towDeliveryHint');
        if (!el) return;
        if (!TOW_DELIVERY_ENABLED || !gameState.towing.active || this.claimedThisTow) {
            el.textContent = '';
            el.style.display = 'none';
            return;
        }
        el.style.display = 'block';
        el.textContent = 'Tow to garage / parking for scrap';
    },

    getSaveData() {
        return { claimedThisTow: this.claimedThisTow };
    },

    loadSaveData(data) {
        if (data && data.claimedThisTow != null) {
            this.claimedThisTow = !!data.claimedThisTow;
        }
    },

    reset() {
        this.claimedThisTow = false;
        this._updateUI();
    },
};
