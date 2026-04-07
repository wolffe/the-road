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

// Damage smoke (HP <= 20): larger, darker than exhaust
function createDamageSmokeParticle(car) {
    const backOffset = car.length / 2;
    const x = car.x - Math.sin(car.rotation) * backOffset + (Math.random() - 0.5) * 8;
    const y = car.y + Math.cos(car.rotation) * backOffset + (Math.random() - 0.5) * 8;
    return {
        x, y,
        size: 4 + Math.random() * 5,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.008,
        dx: -Math.sin(car.rotation) * 0.3 + (Math.random() - 0.5) * 0.4,
        dy: Math.cos(car.rotation) * 0.3 + (Math.random() - 0.5) * 0.4
    };
}

function updateDamageSmokeParticles(gameState) {
    if (gameState.car.hp > 20) return;
    const arr = gameState.car.damageSmokeParticles;
    gameState.car.damageSmokeParticles = arr.filter(p => p.life > 0);
    gameState.car.damageSmokeParticles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= p.decay;
        p.size += 0.15;
        p.dx *= 0.96;
        p.dy *= 0.96;
    });
    for (let i = 0; i < 2; i++) {
        gameState.car.damageSmokeParticles.push(createDamageSmokeParticle(gameState.car));
    }
}

function drawDamageSmokeParticles(ctx, gameState) {
    if (gameState.car.hp > 20) return;
    ctx.save();
    gameState.car.damageSmokeParticles.forEach(p => {
        const alpha = p.life * 0.5;
        ctx.fillStyle = `rgba(40, 35, 30, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x - gameState.viewport.x, p.y - gameState.viewport.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
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