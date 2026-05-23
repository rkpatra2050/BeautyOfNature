/* ==========================================================================
   CHROMA JELLY: SQUISHY HOP! - AIM MATH & SQUISH PHYSICS ENGINE
   ========================================================================== */

export class Physics {
    static GRAVITY = 550; // Custom downward gravity pull for bouncy floatiness

    /**
     * Projects Gloop's trajectory forward in time to draw aim dots
     * Formula:
     * x(t) = x0 + vx * t
     * y(t) = y0 + vy * t + 0.5 * g * t^2
     */
    static calculateAimTrajectory(x0, y0, vx, vy, maxSteps = 30, timeStep = 0.05) {
        const points = [];
        let px = x0;
        let py = y0;
        let currVx = vx;
        let currVy = vy;

        for (let i = 0; i < maxSteps; i++) {
            // Apply gravity step
            currVy += this.GRAVITY * timeStep;

            px += currVx * timeStep;
            py += currVy * timeStep;

            points.push({ x: px, y: py });
        }

        return points;
    }

    /**
     * Checks if Gloop collides with a platform
     */
    static checkSlimePlatformCollision(slime, platform) {
        // Slime bottom coordinates
        const slimeBottomY = slime.y + slime.radius;
        
        // Simple bounding box checks
        const withinX = slime.x + slime.radius * 0.5 > platform.x && 
                        slime.x - slime.radius * 0.5 < platform.x + platform.width;

        // Check if slime is falling downward through the platform top boundary
        if (withinX && 
            slime.vy > 0 && 
            slimeBottomY >= platform.y && 
            slime.y - slime.radius <= platform.y + platform.height) {
            return true;
        }

        return false;
    }

    /**
     * Bounding box overlap checkers
     */
    static checkOverlap(objA, objB) {
        const dx = objA.x - objB.x;
        const dy = objA.y - objB.y;
        const distSq = dx*dx + dy*dy;
        const sumRad = objA.radius + objB.radius;
        return distSq <= sumRad * sumRad;
    }
}
