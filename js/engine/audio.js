/* ==========================================================================
   WHISPERS OF THE EARTH - WEB AUDIO PROCEDURAL NATURE SYNTH
   ========================================================================== */

export class NatureAudioSynth {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.isMuted = true;

        // Wind noise nodes
        this.windSource = null;
        this.windFilter = null;
        this.windGain = null;
        this.windModulatorInterval = null;

        // Chimes loop trackers
        this.chimesInterval = null;
        this.chimesScale = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // E4, G4, A4, C5, D5, E5, G5
    }

    /**
     * Initialize audio context on first user click
     */
    init() {
        if (this.ctx) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();

            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.0, this.ctx.currentTime); // start silent
            this.masterVolume.connect(this.ctx.destination);
            
            // Build the white noise wind node
            this.initWindBreeze();
        } catch (e) {
            console.warn("Web Audio API not supported by browser:", e);
        }
    }

    /**
     * Toggle natural soundscape
     */
    toggle() {
        this.init();
        if (!this.ctx) return true;

        if (this.isMuted) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.isMuted = false;
            // Fade in gently over 1 second (no harsh snaps!)
            this.masterVolume.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.8);
            this.startForestChimes();
        } else {
            this.isMuted = true;
            // Fade out gently over 0.5 seconds
            this.masterVolume.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.4);
            this.stopForestChimes();
        }
        return this.isMuted;
    }

    /**
     * Create procedural wind rumble using white noise buffer + bandpass sweeps
     */
    initWindBreeze() {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise array
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Looping noise source
        this.windSource = this.ctx.createBufferSource();
        this.windSource.buffer = buffer;
        this.windSource.loop = true;

        // Bandpass filter to sculpt white noise into a gentle hollow whistle
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.Q.setValueAtTime(4.0, this.ctx.currentTime); // medium narrow band
        this.windFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

        // Connections: source -> filter -> gain -> master
        this.windSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterVolume);

        // Start playing wind
        this.windSource.start(0);

        // Modulate wind speed/pitch frequency programmatically using sine sweeps (breeze whoosh!)
        let phase = 0;
        this.windModulatorInterval = setInterval(() => {
            if (this.isMuted || !this.windFilter) return;

            phase += 0.04;
            // Sweep frequency between 180Hz (deep hum) and 450Hz (high wind whistle)
            const targetFreq = 260 + Math.sin(phase) * 120 + Math.cos(phase * 0.4) * 40;
            this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.35);

            // Modulate gain slightly to simulate gust shifts
            const targetGain = 0.12 + Math.sin(phase) * 0.08 + Math.cos(phase * 0.6) * 0.03;
            this.windGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
        }, 150);
    }

    /**
     * Procedural wind chimes (gentle major scale tones triggered randomly)
     */
    startForestChimes() {
        if (!this.ctx) return;

        const playRandomChime = () => {
            if (this.isMuted) return;

            const time = this.ctx.currentTime;
            
            // Pick a beautiful note from the major chimes scale
            const noteFreq = this.chimesScale[Math.floor(Math.random() * this.chimesScale.length)];

            // Create chime synthesizer chain
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine'; // pure glassy tone
            osc.frequency.setValueAtTime(noteFreq, time);

            // Tiny detuned harmonic for metallic chime feel
            const overtone = this.ctx.createOscillator();
            overtone.type = 'sine';
            overtone.frequency.setValueAtTime(noteFreq * 2.008, time); // slightly off-integer multiplier

            const overtoneGain = this.ctx.createGain();
            overtoneGain.gain.setValueAtTime(0.015, time); // quiet

            // Fast attack and extremely long romantic decay (rings for 4.5 seconds)
            gain.gain.setValueAtTime(0.0, time);
            gain.gain.linearRampToValueAtTime(0.08, time + 0.03); // quick ring attack
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 4.5); // long sustain

            // Connect chimes
            osc.connect(gain);
            overtone.connect(overtoneGain);
            overtoneGain.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(time);
            overtone.start(time);
            
            osc.stop(time + 4.8);
            overtone.stop(time + 4.8);

            // Schedule next chime: randomly between 3 and 7 seconds apart
            const nextTriggerMs = 3000 + Math.random() * 4000;
            this.chimesInterval = setTimeout(playRandomChime, nextTriggerMs);
        };

        // Trigger first chime
        this.chimesInterval = setTimeout(playRandomChime, 2000);
    }

    stopForestChimes() {
        if (this.chimesInterval) {
            clearTimeout(this.chimesInterval);
            this.chimesInterval = null;
        }
    }
}
