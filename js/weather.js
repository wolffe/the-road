/**
 * Rare rain: grip on road/mud, light screen overlay. Mostly clear skies.
 * Toggle: WEATHER_ENABLED — tweak intervals/chances at top.
 */
const WEATHER_ENABLED = true;

/** Average seconds between “should we try to change weather?” checks while clear. */
const WEATHER_CLEAR_CHECK_INTERVAL = 55;
/** Chance (0–1) per check to start light rain from clear. Keep low. */
const WEATHER_RAIN_START_CHANCE = 0.035;
/** Rain duration range (seconds). */
const WEATHER_RAIN_MIN_SEC = 38;
const WEATHER_RAIN_MAX_SEC = 95;
/** After rain ends, seconds before next check cycle feels natural. */
const WEATHER_POST_RAIN_COOLDOWN = 25;

const weatherSystem = {
    /** 0 = dry, 1 = heavy (scaled for grip + draw). */
    intensity: 0,
    _accumClear: 0,
    _rainLeft: 0,
    _cooldown: 0,

    init() {
        this.intensity = 0;
        this._accumClear = WEATHER_CLEAR_CHECK_INTERVAL * 0.5;
        this._rainLeft = 0;
        this._cooldown = 0;
    },

    /** Call once per frame; dtSec ~ 1/60. Uses gameState.time.totalSeconds only for determinism feel. */
    update(dtSec) {
        if (!WEATHER_ENABLED) {
            this.intensity = 0;
            return;
        }
        const seed = (typeof gameState !== 'undefined' && gameState.world) ? (gameState.world.seed | 0) : 0;
        const t = typeof gameState !== 'undefined' ? gameState.time.totalSeconds : 0;

        if (this._rainLeft > 0) {
            this._rainLeft -= dtSec;
            const phase = Math.max(0, Math.min(1, this._rainLeft / (WEATHER_RAIN_MAX_SEC * 0.35)));
            this.intensity = 0.35 + 0.55 * phase + 0.08 * Math.sin(t * 2.1);
            if (this._rainLeft <= 0) {
                this.intensity = 0;
                this._cooldown = WEATHER_POST_RAIN_COOLDOWN;
            }
            return;
        }

        if (this._cooldown > 0) {
            this._cooldown -= dtSec;
            this.intensity = 0;
            return;
        }

        this._accumClear += dtSec;
        if (this._accumClear < WEATHER_CLEAR_CHECK_INTERVAL) {
            this.intensity = 0;
            return;
        }
        this._accumClear = 0;

        const roll = (typeof hash2 === 'function')
            ? hash2(Math.floor(t * 0.2), seed, 8800)
            : Math.random();
        if (roll < WEATHER_RAIN_START_CHANCE) {
            const span = WEATHER_RAIN_MAX_SEC - WEATHER_RAIN_MIN_SEC;
            const dur = WEATHER_RAIN_MIN_SEC + ((typeof hash2 === 'function')
                ? hash2(seed, Math.floor(t), 8801)
                : Math.random()) * span;
            this._rainLeft = dur;
        }
    },

    /** Extra multiplier on terrain speed (1 = no change). Applied after tire grip on penalties. */
    getTerrainSpeedFactor(terrainType) {
        if (!WEATHER_ENABLED || this.intensity < 0.08) return 1;
        let f = 1 - this.intensity * 0.07;
        if (terrainType === 'mud' || terrainType === 'road') {
            f -= this.intensity * 0.1;
        }
        if (terrainType === 'sands' || terrainType === 'wasteland') {
            f -= this.intensity * 0.04;
        }
        return Math.max(0.78, f);
    },

    draw(ctx, canvasW, canvasH) {
        if (!WEATHER_ENABLED || this.intensity < 0.06) return;
        const t = Date.now() / 1000;
        ctx.save();
        ctx.globalAlpha = 0.12 + this.intensity * 0.18;
        const g = ctx.createLinearGradient(0, 0, 0, canvasH);
        g.addColorStop(0, 'rgba(70, 78, 92, 0.5)');
        g.addColorStop(1, 'rgba(45, 50, 58, 0.85)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.globalAlpha = 0.15 + this.intensity * 0.2;
        ctx.strokeStyle = 'rgba(200, 210, 230, 0.35)';
        ctx.lineWidth = 1;
        const stride = 14;
        const skew = 6;
        for (let i = 0; i < 28; i++) {
            const x = ((i * 97 + t * 40) % (canvasW + 120)) - 60;
            const y = (i * stride * 3 + t * 120) % (canvasH + 80);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + skew, y + 22);
            ctx.stroke();
        }
        ctx.restore();
    },

    getSaveData() {
        return {
            intensity: this.intensity,
            rainLeft: this._rainLeft,
            cooldown: this._cooldown,
        };
    },

    loadSaveData(data) {
        if (!data) return;
        if (data.rainLeft != null) this._rainLeft = Math.max(0, data.rainLeft);
        if (data.cooldown != null) this._cooldown = Math.max(0, data.cooldown);
        if (data.intensity != null) this.intensity = Math.max(0, data.intensity);
    },

    reset() {
        this.init();
    },
};
