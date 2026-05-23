/* ==========================================================================
   NEBULA DRIFT: CHRONO-SLING - PLAYER PROBE STATE & RENDERING
   ========================================================================== */

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 220;  // Initial horizontal propulsion velocity
        this.vy = -180; // Initial vertical climb velocity
        this.radius = 8;
        this.mass = 1;

        // Gravity anchor states
        this.isAnchored = false;
        this.anchorStar = null;
        this.anchorDistance = 0;
        this.orbitAngle = 0;
        this.orbitSpeed = 0; // angular velocity

        // Chrono-Shift Dilation status
        this.chronoFuel = 100;
        this.maxChronoFuel = 100;
        this.isChronoActive = false;

        // Upgrade Modifiers (acquired from the Cosmic Lab shop)
        this.upgradeTractorLevel = 0;
        this.upgradeChronoLevel = 0;
        this.upgradeThrusterLevel = 0;

        this.tractorRange = 360;  // Pixels base scan radius
        this.chronoDrainRate = 22; // Fuel units consumed per second during slow-mo
        this.chronoRecoveryRate = 12; // Fuel units recovered per second while inactive

        // Visual trailing trail buffers
        this.trail = [];
        this.maxTrailLength = 32;

        // Interactive visual configuration (Neon Haze default)
        this.skin = 'neon';
    }

    /**
     * Resets the player state upon respawn
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 220;
        this.vy = -180;
        this.isAnchored = false;
        this.anchorStar = null;
        this.chronoFuel = this.maxChronoFuel;
        this.isChronoActive = false;
        this.trail = [];
    }

    /**
     * Updates trails and handles chrono tank fuel recovery/drainage
     */
    update(dt) {
        // Record trail points (store physical coordinate snapshots)
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Chrono Tank calculations
        if (this.isChronoActive) {
            // Drain fuel (scaled by dt)
            this.chronoFuel = Math.max(0, this.chronoFuel - this.chronoDrainRate * dt);
            if (this.chronoFuel <= 0) {
                this.isChronoActive = false;
            }
        } else {
            // Recover fuel
            this.chronoFuel = Math.min(this.maxChronoFuel, this.chronoFuel + this.chronoRecoveryRate * dt);
        }
    }

    /**
     * Purchases upgrades and updates base multipliers
     */
    buyUpgrade(type, cost) {
        if (type === 'tractor') {
            this.upgradeTractorLevel++;
            this.tractorRange = 360 * (1 + this.upgradeTractorLevel * 0.25);
        } else if (type === 'chrono') {
            this.upgradeChronoLevel++;
            this.maxChronoFuel = 100 * (1 + this.upgradeChronoLevel * 0.3);
            this.chronoFuel = this.maxChronoFuel;
        } else if (type === 'thruster') {
            this.upgradeThrusterLevel++;
            // Apply speed multiplier to escape triggers
            const boost = 1 + this.upgradeThrusterLevel * 0.15;
            this.vx *= boost;
            this.vy *= boost;
        }
    }

    /**
     * Returns color schemes based on active skin selector
     */
    getSkinColors() {
        switch (this.skin) {
            case 'matrix':
                return { primary: '#39ff14', secondary: '#00ff66', glow: 'rgba(57, 255, 20, 0.4)' };
            case 'rainbow':
                return { primary: '#ffbd00', secondary: '#ff6600', glow: 'rgba(255, 189, 0, 0.4)' };
            case 'pulsar':
                return { primary: '#ff007f', secondary: '#ffbd00', glow: 'rgba(255, 0, 127, 0.4)' };
            case 'neon':
            default:
                return { primary: '#00f0ff', secondary: '#ff007f', glow: 'rgba(0, 240, 255, 0.4)' };
        }
    }

    /**
     * Renders probe and custom trailing ribbons
     */
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        const colors = this.getSkinColors();

        // 1. Draw glowing fading trails behind the probe (Ribbon style)
        if (this.trail.length > 1) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            for (let i = 1; i < this.trail.length; i++) {
                const p1 = this.trail[i - 1];
                const p2 = this.trail[i];
                const ratio = i / this.trail.length;

                ctx.strokeStyle = colors.primary;
                ctx.globalAlpha = ratio * 0.45;
                ctx.lineWidth = this.radius * ratio * 1.5;

                ctx.beginPath();
                ctx.moveTo(p1.x - camera.x, p1.y - camera.y);
                ctx.lineTo(p2.x - camera.x, p2.y - camera.y);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 2. Draw actual probe core
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.primary;

        // Outer glow aura
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // White core nucleus
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 3. Draw a glowing dash circle if anchor is engaged
        if (this.isAnchored && this.anchorStar) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            // Draw line to anchor star
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(this.anchorStar.x - camera.x, this.anchorStar.y - camera.y);
            ctx.stroke();

            ctx.restore();
        }
    }
}
