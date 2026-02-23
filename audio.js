const SOUNDS = {
    engine: {
        src: 'sounds/engine-loop.mp3',
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
    collect: {
        src: 'sounds/collect.mp3',
        volume: 0.6
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
        if (!this.audioElements.has(name)) return;

        const audio = this.audioElements.get(name);

        if (loop && !audio.paused) return;

        audio.loop = loop;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    stopSound(name) {
        if (!this.audioElements.has(name)) return;

        const audio = this.audioElements.get(name);
        audio.pause();
        audio.currentTime = 0;
    }

    updateEngineSound(speed) {
        if (!this.audioElements.has('engine')) return;

        const audio = this.audioElements.get('engine');
        if (audio.paused) return;

        const absSpeed = Math.abs(speed);
        audio.playbackRate = 0.5 + Math.min(absSpeed, 2) * 1.25;
        audio.volume = Math.min(0.4, 0.2 + absSpeed * 0.1) * this.masterVolume;
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
