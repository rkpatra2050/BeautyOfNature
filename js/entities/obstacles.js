/* ==========================================================================
   NEBULA DRIFT: CHRONO-SLING - HAZARD ASTEROIDS & SPACE OBSTACLES
   ========================================================================== */

export class Obstacle {
    constructor(x, y, radius = 26) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        // Random slow velocity for dynamic drift
        this.vx = (Math.random() * 50 - 25);
        this.vy = (Math.random() * 50 - 25);

        // Procedural craggy rock visual geometry
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() * 0.8 - 0.4); // radian spin speed per second
        this.vertices = [];
        this.generateCraggyGeometry();

        // Neon warning color: deep volcanic dark fill with glowing crimson threat border
        this.color = '#ff0055';
        this.fillColor = '#0b0616';
    }

    /**
     * Creates procedural craggy poly vertices to draw realistic space debris
     */
    generateCraggyGeometry() {
        const numPoints = 8 + Math.floor(Math.random() * 5); // 8-12 rock vertices
        const angleStep = (Math.PI * 2) / numPoints;

        for (let i = 0; i < numPoints; i++) {
            const angle = angleStep * i;
            // Introduce cragginess factor (radius variance between 75% and 115%)
            const variance = 0.75 + Math.random() * 0.4;
            const r = this.radius * variance;
            
            this.vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
    }

    /**
     * Standard movement physics update
     */
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;
    }

    /**
     * Draw procedural vector asteroid with glowing crimson warning edges
     */
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Viewport culling
        if (screenX < -this.radius * 2 || screenX > camera.width + this.radius * 2 ||
            screenY < -this.radius * 2 || screenY > camera.height + this.radius * 2) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Setup neon warning strokes
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.fillColor;
        ctx.lineWidth = 2;

        // Draw irregular rock shape polygon
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();

        // Draw some minor visual cracks or craters inside asteroid
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Inner fracture line 1
        ctx.moveTo(this.vertices[0].x * 0.4, this.vertices[0].y * 0.4);
        ctx.lineTo(this.vertices[3].x * 0.3, this.vertices[3].y * 0.3);
        // Inner fracture line 2
        ctx.moveTo(this.vertices[5].x * 0.3, this.vertices[5].y * 0.3);
        ctx.lineTo(this.vertices[7].x * 0.4, this.vertices[7].y * 0.4);
        ctx.stroke();

        ctx.restore();
    }
}
