/** Temporarily off: no engine loop load/play/update (drift, splash, impact unchanged). */
const ENGINE_SOUND_ENABLED = false;

const SOUNDS = {
    engine: {
        src: 'assets/audio/engine-loop.mp3',
        loop: true,
        volume: 0.4
    },
    splash: {
        src: 'sounds/splash.ogg',
        volume: 0.3
    },
    impact: {
        src: 'sounds/impact.ogg',
        volume: 0.5
    },
    drift: {
        src: 'sounds/tire-squeal.mp3',
        volume: 0.3
    }
};

class AudioManager {
    constructor() {
        this.audioElements = new Map();
        this.isMuted = false;
        this.masterVolume = 1;
    }

    async loadSounds() {
        for (const [key, sound] of Object.entries(SOUNDS)) {
            if (key === 'engine' && !ENGINE_SOUND_ENABLED) continue;
            try {
                const audio = new Audio(sound.src);
                audio.loop = !!sound.loop;
                audio.volume = (sound.volume || 0.5) * this.masterVolume;
                audio.preload = 'auto';

                await new Promise((resolve) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', () => {
                        console.warn(`Failed to load sound: ${key}`);
                        resolve();
                    }, { once: true });
                    audio.load();
                });

                this.audioElements.set(key, audio);
            } catch (error) {
                console.warn(`Failed to load sound: ${key}`);
            }
        }
    }

    playSound(name, loop = false) {
        if (name === 'engine' && !ENGINE_SOUND_ENABLED) return;
        if (!this.audioElements.has(name)) return;

        const audio = this.audioElements.get(name);

        if (loop && !audio.paused) return;

        audio.loop = loop;
        audio.currentTime = 0;
        audio.play().catch(() => { });
    }

    stopSound(name) {
        if (name === 'engine' && !ENGINE_SOUND_ENABLED) return;
        if (!this.audioElements.has(name)) return;

        const audio = this.audioElements.get(name);
        audio.pause();
        audio.currentTime = 0;
    }

    /**
     * Engine loop: HTMLAudioElement.playbackRate changes pitch and loop speed together
     * (same as tape deck / sampler — good enough for arcade; for “RPM without chipmunk tempo”
     * you’d use Tone.PitchShift or layered samples instead).
     */
    updateEngineSound(speed) {
        if (!ENGINE_SOUND_ENABLED) return;
        if (!this.audioElements.has('engine')) return;

        const audio = this.audioElements.get('engine');
        if (audio.paused) return;

        const absSpeed = Math.abs(speed);
        const maxSpeed = 2.4;
        const t = Math.min(absSpeed / maxSpeed, 1);
        const shaped = Math.pow(t, 0.82);
        const rateMin = 0.78;
        const rateMax = 2.05;
        audio.playbackRate = rateMin + shaped * (rateMax - rateMin);
        audio.volume = Math.min(0.45, 0.18 + shaped * 0.28) * this.masterVolume;
    }

    setMasterVolume(value) {
        this.masterVolume = value;
        for (const [key, audio] of this.audioElements) {
            audio.volume = (SOUNDS[key].volume || 0.5) * this.masterVolume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.setMasterVolume(this.isMuted ? 0 : 1);
    }

    stopAllSounds() {
        for (const [name] of this.audioElements) {
            this.stopSound(name);
        }
    }
}

window.audioManager = new AudioManager();
