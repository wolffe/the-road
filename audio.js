// Sound System
const SOUNDS = {
    engine: {
        src: 'sounds/engine-loop.mp3',  // Using .ogg for better compression
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
        //loop: true,
        volume: 0.3
    }
};

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundBuffers = new Map();
        this.activeSounds = new Map();
        this.isMuted = false;
        this.masterVolume = this.audioContext.createGain();
        this.masterVolume.connect(this.audioContext.destination);
    }

    async loadSounds() {
        for (const [key, sound] of Object.entries(SOUNDS)) {
            try {
                const response = await fetch(sound.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.soundBuffers.set(key, audioBuffer);
            } catch (error) {
                console.warn(`Failed to load sound: ${key}`);
            }
        }
    }

    playSound(name, loop = false) {
        if (!this.soundBuffers.has(name)) return;

        // If it's a looping sound that's already playing, don't start it again
        if (loop && this.activeSounds.has(name)) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.soundBuffers.get(name);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = SOUNDS[name].volume || 0.5;

        source.connect(gainNode);
        gainNode.connect(this.masterVolume);

        source.loop = loop;
        source.start(0);

        if (loop) {
            this.activeSounds.set(name, { source, gainNode });
        }

        source.onended = () => {
            if (!loop) {
                source.disconnect();
                gainNode.disconnect();
            }
        };

        return { source, gainNode };
    }

    stopSound(name) {
        if (this.activeSounds.has(name)) {
            const { source, gainNode } = this.activeSounds.get(name);
            source.stop();
            source.disconnect();
            gainNode.disconnect();
            this.activeSounds.delete(name);
        }
    }

    updateEngineSound(speed) {
        if (!this.activeSounds.has('engine')) return;

        const { source, gainNode } = this.activeSounds.get('engine');
        const absSpeed = Math.abs(speed);

        // Adjust pitch based on speed
        source.playbackRate.value = 0.5 + Math.min(absSpeed, 2) * 1.25;

        // Adjust volume based on speed
        gainNode.gain.value = Math.min(0.4, 0.2 + absSpeed * 0.1);
    }

    setMasterVolume(value) {
        this.masterVolume.gain.value = value;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterVolume.gain.value = this.isMuted ? 0 : 1;
    }

    stopAllSounds() {
        for (const [name] of this.activeSounds) {
            this.stopSound(name);
        }
    }
}

// Create and expose a single instance globally
window.audioManager = new AudioManager(); 