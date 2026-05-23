/* ==========================================================================
   NEBULA DRIFT: CHRONO-SLING - STAR ANCHORS & CRYSTAL COLLECTIBLES
   ========================================================================== */

export class Star {
    constructor(x, y, radius = 24, mass = 1.0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.mass = mass;
        this.gravityMultiplier = 1.0;
        
        // Define dynamic gravity interaction range
        this.gravityRange = radius * 8;

        // Visual pulsing timing
        this.pulseTime = Math.random() * Math.PI * 2;
        this.pulseSpeed = 1.5 + Math.random() * 2;
        this.hue = Math.floor(Math.random() * 60) + 180; // beautiful range from blue to violet HSL

        // Generate crystal orbitals around this star
        this.stardustOrbitals = [];
        this.spawnStardustOrbitals();
    }

    /**
     * Spawns 2 to 4 stardust crystals orbiting this star
     */
    spawnStardustOrbitals() {
        const count = 2 + Math.floor(Math.random() * 3);
        const baseRadius = this.radius * 1.8;
        
        for (let i = 0; i < count; i++) {
            const orbitRadius = baseRadius + (i * 24);
            const startAngle = (Math.PI * 2 / count) * i + Math.random();
            const rotSpeed = (0.5 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);

            this.stardustOrbitals.push(new Stardust(
                this.x, this.y, orbitRadius, startAngle, rotSpeed
            ));
        }
    }

    /**
     * Animates orbital rotation of stars and stardust crystals
     */
    update(dt) {
        this.pulseTime += this.pulseSpeed * dt;
        
        // Update orbiting stardust crystals
        this.stardustOrbitals.forEach(dust => dust.update(this.x, this.y, dt));
    }

    /**
     * Renders anchor gravity field (radial gradient circle) and hot stellar core
     */
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Dynamic pulse scaling
        const pulseRatio = 1.0 + Math.sin(this.pulseTime) * 0.08;
        const currentGravityRange = this.gravityRange * pulseRatio;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // 1. Draw gravitational aura (fading glowing capture boundaries)
        let grad = ctx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, currentGravityRange);
        grad.addColorStop(0, `hsla(${this.hue}, 90%, 50%, 0.15)`);
        grad.addColorStop(0.5, `hsla(${this.hue}, 90%, 50%, 0.04)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(screenX - currentGravityRange, screenY - currentGravityRange, currentGravityRange * 2, currentGravityRange * 2);

        // 2. Draw neat gravitational range edge thin dash ring
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 50%, 0.08)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 12]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, currentGravityRange, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Draw stellar hot core with neon blur
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 75%)`;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * pulseRatio, 0, Math.PI * 2);
        ctx.fill();

        // White nucleus center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.45 * pulseRatio, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 4. Draw orbiting stardust crystals
        this.stardustOrbitals.forEach(dust => dust.draw(ctx, camera));
    }
}

/**
 * Orbiting Collectible Stardust Crystals
 */
export class Stardust {
    constructor(parentX, parentY, orbitRadius, startAngle, rotateSpeed) {
        this.orbitRadius = orbitRadius;
        this.angle = startAngle;
        this.rotateSpeed = rotateSpeed;
        
        // Actual coordinates (updated relative to parent star)
        this.x = parentX + Math.cos(startAngle) * orbitRadius;
        this.y = parentY + Math.sin(startAngle) * orbitRadius;

        this.radius = 4;
        this.collected = false;

        // Custom aesthetic tags
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = 2 + Math.random() * 4;
        this.color = Math.random() > 0.5 ? '#ffbd00' : '#ff007f'; // Gold or Pink stardust
        this.pulseTime = Math.random() * Math.PI;
    }

    update(parentX, parentY, dt) {
        if (this.collected) return;

        this.angle += this.rotateSpeed * dt;
        this.spin += this.spinSpeed * dt;
        this.pulseTime += 5 * dt;

        // Recompute physics coordinates
        this.x = parentX + Math.cos(this.angle) * this.orbitRadius;
        this.y = parentY + Math.sin(this.angle) * this.orbitRadius;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Simple culling
        if (screenX < -30 || screenX > camera.width + 30 ||
            screenY < -30 || screenY > camera.height + 30) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.spin);
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Draw diamond-shape glowing stardust crystal
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.8, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.8, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
