// Particle system functions
function createExhaustParticle(car) {
    const exhaustOffset = car.length / 2; // Emit from back of car
    const sideOffset = car.width * 0.3; // Offset to the right side
    const spread = 2; // Random spread

    // Calculate position with both back and side offset
    const x = car.x - Math.sin(car.rotation) * exhaustOffset + Math.cos(car.rotation) * sideOffset + (Math.random() - 0.5) * spread;
    const y = car.y + Math.cos(car.rotation) * exhaustOffset + Math.sin(car.rotation) * sideOffset + (Math.random() - 0.5) * spread;

    return {
        x: x,
        y: y,
        size: 1 + Math.random() * 2,
        life: 1.0, // Full life
        decay: 0.02 + Math.random() * 0.02, // Random decay rate
        dx: -Math.sin(car.rotation) * car.speed * 0.2 + (Math.random() - 0.5) * 0.5,
        dy: Math.cos(car.rotation) * car.speed * 0.2 + (Math.random() - 0.5) * 0.5
    };
}

function updateExhaustParticles(gameState) {
    // Remove dead particles
    gameState.car.exhaustParticles = gameState.car.exhaustParticles.filter(p => p.life > 0);

    // Update remaining particles
    gameState.car.exhaustParticles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= p.decay;
        p.dx *= 0.95; // Slow down
        p.dy *= 0.95;
    });

    // Add new particles if car is moving
    if (Math.abs(gameState.car.speed) > 0.1) {
        const particleCount = Math.ceil(Math.abs(gameState.car.speed) * 2);
        for (let i = 0; i < particleCount; i++) {
            gameState.car.exhaustParticles.push(createExhaustParticle(gameState.car));
        }
    }
}

function drawExhaustParticles(ctx, gameState) {
    ctx.save();
    gameState.car.exhaustParticles.forEach(p => {
        const alpha = p.life * 0.3; // Fade out as life decreases
        ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(
            p.x - gameState.viewport.x,
            p.y - gameState.viewport.y,
            p.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();
}

function createHandbrakeParticle(car) {
    const tireOffset = car.width * 0.4; // Distance from center to tire
    const cos = Math.cos(car.rotation);
    const sin = Math.sin(car.rotation);

    // Alternate between left and right tire
    const side = Math.random() > 0.5 ? 1 : -1;
    const spread = Math.abs(car.speed) * 1; // Reduced spread

    // Calculate position behind the tire
    const x = car.x - Math.sin(car.rotation) * car.length * 0.3 + // Slightly behind car
        Math.cos(car.rotation) * (side * tireOffset) +
        (Math.random() - 0.5) * spread;
    const y = car.y + Math.cos(car.rotation) * car.length * 0.3 +
        Math.sin(car.rotation) * (side * tireOffset) +
        (Math.random() - 0.5) * spread;

    return {
        x: x,
        y: y,
        size: 1.5 + Math.random() * 2, // Slightly smaller particles
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01, // More consistent decay
        dx: -Math.sin(car.rotation) * car.speed * 0.2 + (Math.random() - 0.5) * 0.5,
        dy: Math.cos(car.rotation) * car.speed * 0.2 + (Math.random() - 0.5) * 0.5
    };
}

function updateHandbrakeParticles(gameState) {
    // Remove dead particles
    gameState.car.handbrakeParticles = gameState.car.handbrakeParticles.filter(p => p.life > 0);

    // Update remaining particles
    gameState.car.handbrakeParticles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= p.decay;
        p.size += 0.05; // Reduced growth rate
        p.dx *= 0.9; // Faster speed decay to keep particles more concentrated
        p.dy *= 0.9;
    });

    // Add new particles if handbraking and moving
    if (gameState.car.isHandbrakeOn && Math.abs(gameState.car.speed) > 0.1) {
        const particleCount = Math.ceil(Math.abs(gameState.car.speed) * 3); // Slightly fewer particles
        for (let i = 0; i < particleCount; i++) {
            gameState.car.handbrakeParticles.push(createHandbrakeParticle(gameState.car));
        }
    }
}

function drawHandbrakeParticles(ctx, gameState) {
    ctx.save();
    gameState.car.handbrakeParticles.forEach(p => {
        const alpha = p.life * 0.3; // Fade out as life decreases
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(
            p.x - gameState.viewport.x,
            p.y - gameState.viewport.y,
            p.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();
}

function createFireParticle(x, y) {
    const spread = 20;
    return {
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        size: 5 + Math.random() * 5,  // Increased initial size
        life: 1.0,
        decay: 0.01 + Math.random() * 0.005,  // Slower decay
        dy: -0.5 - Math.random(),  // Slower upward movement
        dx: (Math.random() - 0.5) * 0.3  // Reduced horizontal drift
    };
}

function updateFireParticles(gameState) {
    if (!gameState.particles.fire) {
        gameState.particles.fire = [];
    }

    // Remove dead particles
    gameState.particles.fire = gameState.particles.fire.filter(p => p.life > 0);

    // Update remaining particles
    gameState.particles.fire.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= p.decay;
        p.size = p.size * (0.98 + (p.life * 0.01));  // Gradual size reduction tied to life
    });

    // Add new particles for each fire tile
    gameState.terrain.forEach(point => {
        if (point.type === 'fire') {
            // Only generate particles for tiles that are on screen
            const screenX = point.x - gameState.viewport.x;
            const screenY = point.y - gameState.viewport.y;

            if (screenX > -point.size && screenX < canvas.width + point.size &&
                screenY > -point.size && screenY < canvas.height + point.size) {
                // Add new particles (reduced count for less intensity)
                const particleCount = 1;
                for (let i = 0; i < particleCount; i++) {
                    gameState.particles.fire.push(createFireParticle(point.x, point.y));
                }
            }
        }
    });
}

function drawFireParticles(ctx, gameState) {
    if (!gameState.particles.fire) return;

    ctx.save();

    // Calculate time of day and night intensity
    const timeOfDay = gameState.time.current * 24;
    const isNight = timeOfDay >= 18 || timeOfDay < 6;
    const nightIntensity = isNight ? 1 :
        (timeOfDay >= 17 && timeOfDay < 18) ? (timeOfDay - 17) :
            (timeOfDay >= 5 && timeOfDay < 6) ? (6 - timeOfDay) : 0;

    // Draw ambient glow for each fire source
    if (nightIntensity > 0) {
        ctx.globalCompositeOperation = 'lighter';
        gameState.terrain.forEach(point => {
            if (point.type === 'fire') {
                const screenX = point.x - gameState.viewport.x;
                const screenY = point.y - gameState.viewport.y;

                // Simple flicker effect
                const flicker = Math.sin(Date.now() / 100) * 0.1 + 0.9;

                // Solid glow circle - 2 tiles radius
                const glowRadius = point.size * 2;

                // First layer - red outer glow
                ctx.fillStyle = `rgba(255, 30, 0, ${0.15 * nightIntensity * flicker})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                // Second layer - orange inner glow
                ctx.fillStyle = `rgba(255, 80, 0, ${0.12 * nightIntensity * flicker})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, glowRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Draw individual fire particles
    gameState.particles.fire.forEach(p => {
        const screenX = p.x - gameState.viewport.x;
        const screenY = p.y - gameState.viewport.y;

        // Base alpha enhanced at night
        const baseAlpha = p.life * (0.7 + (nightIntensity * 0.3));

        // Simple particle glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 50, 0, ${baseAlpha})`;  // More red
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.fillStyle = `rgba(255, 120, 0, ${baseAlpha})`; // Orange-red
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

// Water splash particles
function createWaterSplashParticle(gameState) {
    const speed = Math.abs(gameState.car.speed);
    if (speed < 0.1) return; // Don't create particles if barely moving

    const angle = gameState.car.rotation;
    const spread = 0.8; // Spread angle in radians
    const particleSpeed = speed * 2;

    // Create particles on both sides of the car
    const offsets = [-1, 1];
    offsets.forEach(offset => {
        const particleAngle = angle + (Math.random() - 0.5) * spread;
        const sideOffset = offset * gameState.car.width * 0.4;

        // Calculate position offset from car's center
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const startX = gameState.car.x + sideOffset * cos;
        const startY = gameState.car.y + sideOffset * sin;

        const particle = {
            x: startX,
            y: startY,
            vx: Math.sin(particleAngle) * particleSpeed + (Math.random() - 0.5),
            vy: -Math.cos(particleAngle) * particleSpeed + (Math.random() - 0.5),
            size: 2 + Math.random() * 3,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            alpha: 0.8
        };

        if (!gameState.particles.water) {
            gameState.particles.water = [];
        }
        gameState.particles.water.push(particle);
    });
}

function updateWaterSplashParticles(gameState) {
    if (!gameState.particles.water) return;

    gameState.particles.water = gameState.particles.water.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = (particle.life / particle.maxLife) * 0.8;
        particle.size *= 0.97;

        return particle.life > 0;
    });
}

function drawWaterSplashParticles(ctx, gameState) {
    if (!gameState.particles.water) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    gameState.particles.water.forEach(particle => {
        const screenX = particle.x - gameState.viewport.x;
        const screenY = particle.y - gameState.viewport.y;

        // Create a gradient for each particle
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, particle.size
        );
        gradient.addColorStop(0, `rgba(180, 200, 255, ${particle.alpha})`);
        gradient.addColorStop(1, `rgba(180, 200, 255, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

function createCollisionParticles(gameState, impactX, impactY, carVelX, carVelY, obstacleType) {
    // Calculate car's front position
    const frontOffset = gameState.car.length / 2;
    const startX = gameState.car.x + Math.sin(gameState.car.rotation) * frontOffset;
    const startY = gameState.car.y - Math.cos(gameState.car.rotation) * frontOffset;

    // Create particles in a forward cone
    for (let i = 0; i < 12; i++) {
        // Create particles in a 60-degree cone in the direction of travel
        const spreadAngle = Math.PI / 6; // 30 degrees to each side
        const baseAngle = Math.atan2(carVelY, carVelX);
        const angle = baseAngle - spreadAngle / 2 + (spreadAngle * Math.random());

        // Slower initial speed
        const speed = 1 + Math.random() * 1.5;
        gameState.particles.collision = gameState.particles.collision || [];
        gameState.particles.collision.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed + carVelX * 0.3, // Reduced car velocity influence
            vy: Math.sin(angle) * speed + carVelY * 0.3,
            life: 60, // Longer life for slower movement
            maxLife: 60,
            size: 4,
            color: obstacleType === 'block' ? '#888' : '#8B4513'
        });
    }
}

function updateCollisionParticles(gameState) {
    if (gameState.particles.collision) {
        gameState.particles.collision = gameState.particles.collision.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            // Slower deceleration
            particle.vx *= 0.96;
            particle.vy *= 0.96;
            return particle.life > 0;
        });
    }
} 