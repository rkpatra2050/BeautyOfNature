/* ==========================================================================
   CHROMA JELLY: SQUISHY HOP! - CARTOON PARTICLE ENGINE
   ========================================================================== */

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '#fff';
        this.size = 2;
        this.alpha = 1;
        this.life = 0;
        this.maxLife = 0;
        this.decay = 0.02;
        this.gravity = 0;
        this.type = 'circle'; // 'circle' | 'star' | 'bubble'
    }
}

export class ParticleSystem {
    constructor(maxParticles = 600) {
        this.poolSize = maxParticles;
        this.pool = [];
        
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Particle());
        }
    }

    spawn(x, y, vx, vy, color, size, maxLife, gravity = 0, type = 'circle') {
        let p = null;
        for (let i = 0; i < this.poolSize; i++) {
            if (!this.pool[i].active) {
                p = this.pool[i];
                break;
            }
        }

        if (!p) {
            p = this.pool[0]; // fallback
        }

        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.color = color;
        p.size = size;
        p.alpha = 1.0;
        p.life = maxLife;
        p.maxLife = maxLife;
        p.gravity = gravity;
        p.type = type;
    }

    update(dt) {
        for (let i = 0; i < this.poolSize; i++) {
            const p = this.pool[i];
            if (!p.active) continue;

            // Apply gravity vector if any (like slime drops falling)
            p.vy += p.gravity * dt;

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);

            if (p.life <= 0 || p.alpha <= 0) {
                p.active = false;
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.poolSize; i++) {
            const p = this.pool[i];
            if (!p.active) continue;

            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            // Simple viewport culling
            if (screenX < -40 || screenX > camera.width + 40 ||
                screenY < -40 || screenY > camera.height + 40) {
                continue;
            }

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;

            if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'bubble') {
                // Expanding rings for bubble pops
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * (1.0 + (1.0 - p.alpha) * 1.5), 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'star') {
                // Draw tiny 4-pointed sparkle stars
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - p.size);
                ctx.lineTo(screenX + p.size * 0.4, screenY - p.size * 0.4);
                ctx.lineTo(screenX + p.size, screenY);
                ctx.lineTo(screenX + p.size * 0.4, screenY + p.size * 0.4);
                ctx.lineTo(screenX, screenY + p.size);
                ctx.lineTo(screenX - p.size * 0.4, screenY + p.size * 0.4);
                ctx.lineTo(screenX - p.size, screenY);
                ctx.lineTo(screenX - p.size * 0.4, screenY - p.size * 0.4);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * Eject a splash of jelly droplets when landing or bouncing
     */
    spawnSlimeSplash(x, y, color, count = 18) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + Math.random() * Math.PI; // splash upwards
            const velocity = 50 + Math.random() * 150;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            const size = 3 + Math.random() * 5;
            const life = 0.4 + Math.random() * 0.4;
            const gravity = 450; // gravity makes drops fall!

            this.spawn(x, y, vx, vy, color, size, life, gravity, 'circle');
        }
    }

    /**
     * Sparkles golden stars when eating fruit/candy
     */
    spawnStarBurst(x, y, count = 15) {
        const colors = ['#ffd000', '#ff5e97', '#3bd0ff', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 30 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 5 + Math.random() * 6;
            const life = 0.5 + Math.random() * 0.5;

            this.spawn(x, y, vx, vy, color, size, life, 0, 'star');
        }
    }

    /**
     * Spawns expanding soap rings when bubble pop triggers
     */
    spawnBubblePop(x, y) {
        // Expand 3 nested bubble outline rings
        this.spawn(x, y, 0, 0, 'rgba(59, 208, 255, 0.8)', 16, 0.4, 0, 'bubble');
        this.spawn(x, y, 0, 0, 'rgba(255, 255, 255, 0.9)', 22, 0.45, 0, 'bubble');
        
        // Spawn tiny droplets
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * 80;
            const vy = Math.sin(angle) * 80;
            this.spawn(x, y, vx, vy, 'rgba(59, 208, 255, 0.6)', 3, 0.3, 100, 'circle');
        }
    }

    /**
     * Trails slight rainbow sparkles behind Gloop while launching
     */
    spawnTrail(x, y, skinColor) {
        // Spawn a very slow drift dot with rapid decay
        this.spawn(
            x + (Math.random() * 10 - 5),
            y + (Math.random() * 10 - 5),
            Math.random() * 20 - 10,
            Math.random() * 20 - 10,
            skinColor,
            Math.random() * 3 + 2,
            0.3,
            120, // gentle gravity
            Math.random() > 0.6 ? 'star' : 'circle'
        );
    }
}
