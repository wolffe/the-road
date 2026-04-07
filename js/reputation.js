/**
 * Standing with the wasteland traders — tiers bias pickup rolls slightly.
 * Toggle: set REPUTATION_ENABLED false to disable.
 */
const REPUTATION_ENABLED = true;

const REPUTATION_TIERS = [
    { name: 'Stranger', min: 0 },
    { name: 'Regular', min: 12 },
    { name: 'Known', min: 28 },
    { name: 'Fixer', min: 50 },
];

const reputationSystem = {
    rep: 0,

    init() {
        this.rep = 0;
        this._updateSidebar();
    },

    getTierIndex() {
        let i = 0;
        for (let t = 0; t < REPUTATION_TIERS.length; t++) {
            if (this.rep >= REPUTATION_TIERS[t].min) i = t;
        }
        return i;
    },

    getTierName() {
        return REPUTATION_TIERS[this.getTierIndex()].name;
    },

    /** Multiplies weighted pickup roll — higher rep nudges toward rarer rows (cap applied in each system). */
    getPickupRollMultiplier() {
        if (!REPUTATION_ENABLED) return 1;
        return 1 + this.getTierIndex() * 0.048;
    },

    addRep(n) {
        if (!REPUTATION_ENABLED || !n) return;
        this.rep = Math.max(0, this.rep + n);
        this._updateSidebar();
    },

    _updateSidebar() {
        const el = document.getElementById('reputationText');
        if (el) {
            el.textContent = this.getTierName() + ' (' + this.rep + ' rep)';
            el.style.color = this.getTierIndex() >= 2 ? '#8c8' : '#aaa';
        }
    },

    getSaveData() {
        return { rep: this.rep };
    },

    loadSaveData(data) {
        if (data && data.rep != null) {
            this.rep = Math.max(0, Math.round(data.rep));
            this._updateSidebar();
        }
    },

    reset() {
        this.rep = 0;
        this._updateSidebar();
    },
};

/** Used by engine/tires/etc. pickup rolls — keep rarer items reachable but capped. */
function applyReputationPickupRoll(baseRoll, totalWeight) {
    if (typeof reputationSystem === 'undefined') return baseRoll;
    return Math.min(totalWeight * 0.998, baseRoll * reputationSystem.getPickupRollMultiplier());
}
