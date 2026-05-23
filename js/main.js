/* ==========================================================================
   WHISPERS OF THE EARTH - MAIN SCROLL & DYNAMIC CANVAS OVERLAY
   ========================================================================== */

import { NatureAudioSynth } from './engine/audio.js';

class NatureController {
    constructor() {
        // 1. Audio System
        this.audio = new NatureAudioSynth();

        // 2. Canvas Setup
        this.canvas = document.getElementById('natureCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.width = 0;
        this.height = 0;

        // 3. Immersive Particle Emitter
        this.particles = [];
        this.maxParticles = 50;

        // Current active ecological realm
        // 'HERO' | 'CANOPY' | 'STREAM' | 'PEAK' | 'DECK'
        this.currentRealm = 'HERO';

        // 4. Cache DOM elements
        this.dom = {
            btnToggleAudio: document.getElementById('btnToggleAudio'),
            audioStatusText: document.getElementById('audioStatusText'),
            sections: document.querySelectorAll('.narrative-section'),
            coupleBackground: document.querySelector('.couple-background-layer'),
            body: document.body,
            introScreen: document.getElementById('introScreen'),
            typewriterText: document.getElementById('typewriterText'),
            typewriterCursor: document.querySelector('.typewriter-cursor'),
            introProgressFill: document.getElementById('introProgressFill'),
            btnOpenExplorer: document.getElementById('btnOpenExplorer'),
            btnCloseExplorer: document.getElementById('btnCloseExplorer'),
            explorerOverlay: document.getElementById('explorerOverlay'),
            btnPrevSlide: document.getElementById('btnPrevSlide'),
            btnNextSlide: document.getElementById('btnNextSlide'),
            bullets: document.querySelectorAll('.bullet'),
            slides: document.querySelectorAll('.carousel-slide')
        };

        this.currentSlideIndex = 0;

        // Standard HSL color matrices for dynamic color morph transitions
        // Expressed as RGB arrays [R, G, B] to facilitate smooth linear interpolation
        this.realmColors = {
            HERO: [5, 14, 9],       // Deep mist green
            CANOPY: [9, 26, 16],    // Lush forest green
            STREAM: [8, 29, 36],    // Cool stream deep blue
            PEAK: [33, 18, 14],     // Peak volcanic clay orange
            DECK: [18, 7, 4]        // Fading sunset amber base
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // A. Typewriter Intro – character-by-character, then auto-transition
        this.startTypewriterIntro();

        // B. Explorer Overlay Trigger Toggles
        if (this.dom.btnOpenExplorer) {
            this.dom.btnOpenExplorer.addEventListener('click', () => {
                if (this.dom.explorerOverlay) {
                    this.dom.explorerOverlay.scrollTop = 0; // scroll back to top of Realm I
                    this.dom.explorerOverlay.classList.add('open');
                    document.body.style.overflow = 'hidden'; // lock background scrolling
                }
            });
        }
        if (this.dom.btnCloseExplorer) {
            this.dom.btnCloseExplorer.addEventListener('click', () => {
                if (this.dom.explorerOverlay) {
                    this.dom.explorerOverlay.classList.remove('open');
                    document.body.style.overflow = ''; // restore background scrolling
                }
            });
        }

        // C. Carousel Prev/Next Slide Trigger Toggles
        if (this.dom.btnPrevSlide) {
            this.dom.btnPrevSlide.addEventListener('click', () => this.navigateSlide(-1));
        }
        if (this.dom.btnNextSlide) {
            this.dom.btnNextSlide.addEventListener('click', () => this.navigateSlide(1));
        }

        // D. Carousel Bullets click
        if (this.dom.bullets) {
            this.dom.bullets.forEach(bullet => {
                bullet.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.index, 10);
                    this.showSlide(idx);
                });
            });
        }

        // Event hooks for sound
        this.dom.btnToggleAudio.addEventListener('click', () => {
            const isMuted = this.audio.toggle();
            if (isMuted) {
                this.dom.btnToggleAudio.classList.remove('active');
                this.dom.audioStatusText.innerText = "UNMUTE SOUNDSCAPE";
            } else {
                this.dom.btnToggleAudio.classList.add('active');
                this.dom.audioStatusText.innerText = "SOUNDSCAPE: LISTENING";
            }
        });

        // Scroll listener for dynamic parallax and color morphing
        window.addEventListener('scroll', () => this.handleScroll());

        // Populate initial floating pollen particles
        this.initParticles();

        // Boot canvas frame loop
        requestAnimationFrame((t) => this.tick(t));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(this.dpr, this.dpr);
    }

    /**
     * Master scroll tracking:
     * 1. Interpolates body background color smoothly based on scroll progress
     * 2. Triggers elegant parallax translates on text elements and background couple image
     */
    handleScroll() {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (scrollHeight <= 0) return;

        const progress = Math.max(0, Math.min(1.0, scrollTop / scrollHeight));

        // A. Dynamic Background Color Morphing
        this.morphBackgroundColor(progress);

        // B. Dynamic Parallax Scrolling translate offsets
        this.dom.sections.forEach(section => {
            const sectionRect = section.getBoundingClientRect();
            
            // If section is currently moving inside the viewport
            if (sectionRect.top < this.height && sectionRect.bottom > 0) {
                const title = section.querySelector('.chapter-title, .hero-title, .climax-title');
                const subtitle = section.querySelector('.chapter-subtitle, .hero-subtitle');
                const cards = section.querySelectorAll('.narrative-card, .climax-narrative-box');

                // Compute relative center progress
                const relativeScroll = sectionRect.top / this.height; // ranges roughly between -1 and 1

                if (title) {
                    title.style.transform = `translateY(${relativeScroll * 90}px)`;
                }
                if (subtitle) {
                    subtitle.style.transform = `translateY(${relativeScroll * 50}px)`;
                }

                // Cards slide slightly at staggered rates
                cards.forEach((card, idx) => {
                    const stagger = 20 + (idx * 25);
                    card.style.transform = `translateY(${relativeScroll * stagger}px)`;
                });
            }
        });

        // C. Couple Climax background image zoom parallax
        if (this.dom.coupleBackground) {
            const deckRect = document.getElementById('chapter-deck').getBoundingClientRect();
            if (deckRect.top < this.height) {
                // Map screen slide to small scale factor (1.05 down to 1.0)
                const scrollProgress = deckRect.top / this.height; // 1 to 0
                const targetScale = 1.0 + Math.max(0, scrollProgress) * 0.05;
                this.dom.coupleBackground.style.transform = `scale(${targetScale})`;
            }
        }
    }

    /**
     * Performs RGB color interpolation dynamically based on scroll progression ratio
     */
    morphBackgroundColor(progress) {
        let r, g, b;

        // Progress ranges between 0.0 and 1.0. Map to 4 segments (0.25 each)
        if (progress < 0.25) {
            const segmentProgress = progress / 0.25;
            [r, g, b] = this.interpolateRGB(this.realmColors.HERO, this.realmColors.CANOPY, segmentProgress);
            this.currentRealm = 'CANOPY';
        } else if (progress < 0.5) {
            const segmentProgress = (progress - 0.25) / 0.25;
            [r, g, b] = this.interpolateRGB(this.realmColors.CANOPY, this.realmColors.STREAM, segmentProgress);
            this.currentRealm = 'STREAM';
        } else if (progress < 0.75) {
            const segmentProgress = (progress - 0.5) / 0.25;
            [r, g, b] = this.interpolateRGB(this.realmColors.STREAM, this.realmColors.PEAK, segmentProgress);
            this.currentRealm = 'PEAK';
        } else {
            const segmentProgress = (progress - 0.75) / 0.25;
            [r, g, b] = this.interpolateRGB(this.realmColors.PEAK, this.realmColors.DECK, segmentProgress);
            this.currentRealm = 'DECK';
        }

        // Apply background overrides directly
        this.dom.body.style.backgroundColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    interpolateRGB(colorA, colorB, factor) {
        const r = colorA[0] + (colorB[0] - colorA[0]) * factor;
        const g = colorA[1] + (colorB[1] - colorA[1]) * factor;
        const b = colorA[2] + (colorB[2] - colorA[2]) * factor;
        return [r, g, b];
    }

    /**
     * Particle engine initializations
     */
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle(true)); // random initial positions
        }
    }

    /**
     * Create floating natural elements based on current section
     */
    createParticle(randomY = false) {
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : (Math.random() * 50 - 50),
            size: 2 + Math.random() * 6,
            // Drifts
            vx: Math.random() * 0.8 - 0.4,
            vy: 0.3 + Math.random() * 0.6,
            alpha: 0.2 + Math.random() * 0.6,
            life: 2 + Math.random() * 3, // particle age
            sway: Math.random() * Math.PI,
            swaySpeed: 0.8 + Math.random() * 1.5,
            
            // Map types based on scroll section
            type: this.determineParticleType()
        };
    }

    determineParticleType() {
        if (this.currentRealm === 'CANOPY') {
            return 'leaf'; // forest section
        } else if (this.currentRealm === 'STREAM') {
            return 'bubble'; // river section
        } else if (this.currentRealm === 'PEAK' || this.currentRealm === 'DECK') {
            return 'mote'; // golden sunset dust mote
        }
        return 'pollen'; // default hero pollen
    }

    /**
     * Particle update cycles
     */
    updateParticles(dt) {
        this.particles.forEach((p, idx) => {
            p.sway += p.swaySpeed * dt;

            if (p.type === 'leaf') {
                // Falling forest leaves: sway left/right as they fall
                p.x += (p.vx + Math.sin(p.sway) * 0.8) * (dt * 60);
                p.y += p.vy * (dt * 60) * 0.95;
            } else if (p.type === 'bubble') {
                // River bubbles: float upward instead of falling down!
                p.x += (p.vx + Math.sin(p.sway) * 0.3) * (dt * 60);
                p.y -= p.vy * (dt * 60) * 1.2; // upward vy
            } else if (p.type === 'mote') {
                // Sunset motes: slow hover floating fireflies drift
                p.x += (p.vx + Math.sin(p.sway) * 0.4) * (dt * 60);
                p.y += (p.vy * 0.2 + Math.cos(p.sway) * 0.2) * (dt * 60); // slow drift Y
            } else {
                // Hero pollen: standard quiet drift
                p.x += p.vx * (dt * 60);
                p.y += p.vy * (dt * 60);
            }

            // Recycled conditions: if offscreen or expired Y boundaries
            if (p.y > this.height + 50 || p.y < -50 || p.x > this.width + 50 || p.x < -50) {
                this.particles[idx] = this.createParticle(false); // spawn fresh at top/bottom
            }
        });
    }

    /**
     * Particle renders: Draws vector leaves, bubbles or fireflies
     */
    drawParticles() {
        const ctx = this.ctx;
        ctx.save();

        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;

            if (p.type === 'leaf') {
                // Renders falling organic green leaf shapes
                ctx.fillStyle = '#4f785a'; // leaf green
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.sway * 0.15); // gentle rotating leaf
                
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else if (p.type === 'bubble') {
                // Renders rising river bubbles
                ctx.strokeStyle = '#52e5ff'; // turquoise outline
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();

            } else if (p.type === 'mote') {
                // Renders glowing golden sunset fireflies
                ctx.fillStyle = '#ffbd59'; // warm sunset gold
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffbd59';
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Hero pollen: simple glowing white specs
                ctx.fillStyle = '#f5efe6';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    /**
     * Animation frame cycle tick
     */
    tick(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const delta = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Safe tick cap
        const cappedDt = Math.min(0.05, delta);

        // Core visual refresh
        this.canvasEngineClear();
        this.updateParticles(cappedDt);
        this.drawParticles();

        requestAnimationFrame((t) => this.tick(t));
    }

    canvasEngineClear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    startTypewriterIntro() {
        const fullText = `"Sometimes, we must step away from our screens and break from code, to truly feel the silent, breathtaking beauty of our nature."`;
        const el   = this.dom.typewriterText;
        const cur  = this.dom.typewriterCursor;
        const bar  = this.dom.introProgressFill;

        if (!el) { this.closeIntroScreen(); return; }

        let charIndex = 0;
        const CHAR_SPEED = 42; // ms per character

        const type = () => {
            if (charIndex < fullText.length) {
                el.textContent += fullText[charIndex];
                charIndex++;
                // update progress bar in lockstep
                if (bar) {
                    bar.style.width = ((charIndex / fullText.length) * 100) + '%';
                }
                setTimeout(type, CHAR_SPEED);
            } else {
                // All chars revealed — pause for a beat, hide cursor, then fade out
                setTimeout(() => {
                    if (cur) cur.classList.add('hidden');
                    setTimeout(() => this.closeIntroScreen(), 800);
                }, 900);
            }
        };

        // Short initial delay before typing begins (feel of suspense)
        setTimeout(type, 600);
    }

    closeIntroScreen() {
        if (this.dom.introScreen) {
            this.dom.introScreen.classList.add('fade-out');
            setTimeout(() => {
                this.dom.introScreen.style.display = 'none';
            }, 800); // matches CSS transitions
        }
    }

    navigateSlide(dir) {
        const nextIdx = this.currentSlideIndex + dir;
        this.showSlide(nextIdx);
    }

    showSlide(idx) {
        if (!this.dom.slides || this.dom.slides.length === 0) return;

        // Circular index wrapping
        let targetIdx = idx;
        const totalSlides = this.dom.slides.length;
        targetIdx = (targetIdx % totalSlides + totalSlides) % totalSlides;

        // Deactivate all slides and bullets
        this.dom.slides.forEach(slide => slide.classList.remove('active'));
        this.dom.bullets.forEach(bullet => bullet.classList.remove('active'));

        // Activate target slide and bullet
        this.dom.slides[targetIdx].classList.add('active');
        if (this.dom.bullets[targetIdx]) {
            this.dom.bullets[targetIdx].classList.add('active');
        }

        this.currentSlideIndex = targetIdx;
    }
}

// Start nature orchestrator on document loaded
window.addEventListener('DOMContentLoaded', () => {
    window.nature = new NatureController();
});
