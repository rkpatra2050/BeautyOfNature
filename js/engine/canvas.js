/* ==========================================================================
   CHROMA JELLY: SQUISHY HOP! - RETINA CAMERA & CARTOON SKY RENDERER
   ========================================================================== */

export class CanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // High DPI properties
        this.dpr = 1;
        this.width = 0;
        this.height = 0;

        // Bouncy centered camera tracking Gloop
        this.camera = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            lerp: 0.12 // fast responsive dampening
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.ctx.scale(this.dpr, this.dpr);

        this.camera.width = this.width;
        this.camera.height = this.height;
    }

    /**
     * Smoothly Dampen Camera to track player Gloop vertically
     */
    updateCamera(targetX, targetY, dt) {
        // Keep Gloop centered horizontally, and slightly lower than vertical center
        const desiredX = targetX - this.width / 2;
        const desiredY = targetY - this.height * 0.55;

        const lerpFactor = Math.min(1, this.camera.lerp * (dt * 60));
        
        // Smooth slide camera
        this.camera.x += (desiredX - this.camera.x) * lerpFactor;
        this.camera.y += (desiredY - this.camera.y) * 0.1; // lock vertical track tightly

        // Restrict camera horizontal bounds slightly
        this.camera.x = Math.max(-100, Math.min(500, this.camera.x));
    }

    /**
     * Clears canvas with a gentle white wash for candy ghost trail rendering
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Renders a gorgeous progressive rainbow atmosphere background!
     * As the camera climbs higher (-Y coordinate), the sky colors evolve.
     */
    drawCandySky(cameraY) {
        const ctx = this.ctx;
        
        // Compute altitude climb in pixels
        const altitude = Math.max(0, -cameraY * 0.1);
        
        // Setup gradient that shifts colors based on height
        let grad = ctx.createLinearGradient(0, 0, 0, this.height);
        
        if (altitude < 500) {
            // Sector 1: Ground levels - Peach to Cotton Candy Pink
            grad.addColorStop(0, '#a0e0ff'); // bright blue sky
            grad.addColorStop(0.6, '#ffe1e8'); // light candy pink
            grad.addColorStop(1, '#ffc7d5'); // peach orange
        } else if (altitude < 1500) {
            // Sector 2: Mid atmosphere - Candy Pink to Golden Sun Yellow
            grad.addColorStop(0, '#ffe3ee');
            grad.addColorStop(0.5, '#ffd9a0'); // sunny yellow orange
            grad.addColorStop(1, '#ffeaae'); 
        } else {
            // Sector 3: Cosmic candy - Space violet to neon cyan
            grad.addColorStop(0, '#582b8f'); // deep magical purple
            grad.addColorStop(0.6, '#a873e8'); // soft lavender violet
            grad.addColorStop(1, '#65d5ff'); // neon sky blue
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Render soft floating parallax background clouds
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';

        // Draw three massive distant slow clouds (moving with different parallax speeds)
        const cloudParallaxY = cameraY * 0.1;
        
        // Cloud 1
        let c1x = (Math.abs(cameraY * 0.05) % (this.width + 400)) - 200;
        let c1y = (cloudParallaxY % this.height) + this.height * 0.2;
        this.drawSimpleCloud(ctx, c1x, c1y, 110);

        // Cloud 2
        let c2x = this.width - ((Math.abs(cameraY * 0.02) + 200) % (this.width + 400));
        let c2y = ((cloudParallaxY + this.height * 0.5) % this.height);
        this.drawSimpleCloud(ctx, c2x, c2y, 80);

        ctx.restore();
    }

    /**
     * Vector cartoon cloud shape drawer helper
     */
    drawSimpleCloud(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x - r * 0.6, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.arc(x + r * 0.6, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.arc(x - r * 0.2, y - r * 0.4, r * 0.8, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}
