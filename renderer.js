class Renderer {
    constructor(canvas, gameState, images) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.images = images;

        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    resize() {
        this.canvas.width = window.innerWidth - 240; // 200px panel + 40px padding
        this.canvas.height = window.innerHeight;

        // Ensure smoothing remains enabled after resize
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFrame() {
        this.clear();

        // Calculate ambient light
        const timeOfDay = this.gameState.time.current * 24;
        let daylight;

        if (timeOfDay >= 6 && timeOfDay <= 18) {
            const midday = 12;
            const timeDiff = Math.abs(timeOfDay - midday);
            daylight = 1 - (timeDiff / 6) * 0.3;
        } else if (timeOfDay < 6) {
            daylight = Math.max(0.1, (timeOfDay / 6) * 0.7);
        } else {
            daylight = Math.max(0.1, ((24 - timeOfDay) / 6) * 0.7);
        }

        const darkness = Math.max(0.1, Math.min(0.7, 1 - daylight));

        // Draw in correct order
        this.drawTerrain();
        this.drawTireTracks();
        this.drawWaterSplashParticles();
        this.drawHandbrakeParticles();
        this.drawExhaustParticles();
        this.drawCar();

        // Apply darkness overlay
        this.ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw elements that should appear over darkness
        this.drawFireParticles();
        this.drawCarLights();

        // Draw multiplayer elements if active
        if (this.gameState.multiplayer) {
            this.gameState.multiplayer.drawOtherPlayers(this.ctx);
        }
    }

    drawTerrain() {
        // Draw background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Get current time for water animation
        const waterAnimTime = Date.now() / 1000;

        this.gameState.terrain.forEach(point => {
            const screenX = point.x - this.gameState.viewport.x;
            const screenY = point.y - this.gameState.viewport.y;

            // Culling check
            if (screenX < -point.size * 2 || screenX > this.canvas.width + point.size * 2 ||
                screenY < -point.size * 2 || screenY > this.canvas.height + point.size * 2) {
                return;
            }

            if ((point.type === 'scrap' || point.type === 'circuit' || point.type === 'barrel') && !point.active) {
                this.ctx.fillStyle = TERRAIN_COLORS.collected;
                this.ctx.fillRect(screenX - point.size / 2, screenY - point.size / 2, point.size, point.size);
            } else {
                const baseColor = TERRAIN_COLORS[point.type] || point.originalColor || '#00aa00';

                if (point.type === 'water' || point.type === 'deepwater') {
                    const waveX = Math.sin(point.x / 80 + waterAnimTime * 2) * 0.8;
                    const waveY = Math.cos(point.y / 80 + waterAnimTime * 2) * 0.8;
                    const wave = (waveX + waveY) * 0.7;

                    const ripple = Math.sin(
                        Math.sqrt(
                            Math.pow(point.x / 60, 2) +
                            Math.pow(point.y / 60, 2)
                        ) - waterAnimTime * 3
                    ) * 0.6;

                    const combinedEffect = (wave + ripple);

                    this.ctx.fillStyle = point.type === 'water' ?
                        `rgb(40, 40, ${Math.min(255, 255 + combinedEffect * 60)})` :
                        `rgb(0, 0, ${Math.min(180, 102 + combinedEffect * 50)})`;
                } else {
                    this.ctx.fillStyle = baseColor;
                }

                this.ctx.fillRect(screenX - point.size / 2, screenY - point.size / 2, point.size, point.size);

                if (this.images[point.type]?.complete) {
                    this.ctx.drawImage(
                        this.images[point.type],
                        screenX - point.size / 2,
                        screenY - point.size / 2,
                        point.size,
                        point.size
                    );
                }
            }
        });
    }

    drawTireTracks() {
        this.gameState.tireTrackHistory.forEach(track => {
            const opacity = track.age / (track.type === 'road' ? 900 :
                track.type === 'mud' || track.type === 'snow' ? 600 : 300);

            this.ctx.fillStyle = `rgba(40, 40, 40, ${opacity * 0.7})`;

            this.ctx.beginPath();
            this.ctx.arc(
                track.left.x - this.gameState.viewport.x,
                track.left.y - this.gameState.viewport.y,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(
                track.right.x - this.gameState.viewport.x,
                track.right.y - this.gameState.viewport.y,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    drawCar() {
        this.ctx.save();
        this.ctx.translate(
            this.gameState.car.x - this.gameState.viewport.x,
            this.gameState.car.y - this.gameState.viewport.y
        );
        this.ctx.rotate(this.gameState.car.rotation);

        const width = this.gameState.car.width;
        const length = this.gameState.car.length;

        if (this.images.car?.complete) {
            this.ctx.drawImage(
                this.images.car,
                -width / 2,
                -length / 2,
                width,
                length
            );
        } else {
            // Fallback geometric shape
            const roofWidth = width * 0.7;
            const roofLength = length * 0.5;

            // Car body
            this.ctx.beginPath();
            this.ctx.moveTo(-width / 2, length / 2);
            this.ctx.lineTo(width / 2, length / 2);
            this.ctx.lineTo(width / 2, -length / 2);
            this.ctx.lineTo(-width / 2, -length / 2);
            this.ctx.closePath();
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Roof
            this.ctx.beginPath();
            this.ctx.moveTo(-roofWidth / 2, length / 4);
            this.ctx.lineTo(roofWidth / 2, length / 4);
            this.ctx.lineTo(roofWidth / 2, -length / 4);
            this.ctx.lineTo(-roofWidth / 2, -length / 4);
            this.ctx.closePath();
            this.ctx.fillStyle = '#cc0000';
            this.ctx.fill();
            this.ctx.stroke();

            // Windows
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(-roofWidth / 2 - 1, 0, roofWidth + 2, 2);

            // Bumpers
            this.ctx.fillStyle = '#888';
            this.ctx.fillRect(-width / 2, -length / 2, width, 4);
            this.ctx.fillRect(-width / 2, length / 2 - 4, width, 4);
        }

        this.ctx.restore();
    }

    drawCarLights() {
        if (!this.gameState.car.lightsOn) return;

        this.ctx.save();
        this.ctx.translate(
            this.gameState.car.x - this.gameState.viewport.x,
            this.gameState.car.y - this.gameState.viewport.y
        );
        this.ctx.rotate(this.gameState.car.rotation);

        const width = this.gameState.car.width;
        const length = this.gameState.car.length;

        // Calculate light intensity
        const timeOfDay = this.gameState.time.current * 24;
        let headlightIntensity = 0;

        if (timeOfDay <= 6 || timeOfDay >= 18) {
            headlightIntensity = 1;
        } else if (timeOfDay <= 7 || timeOfDay >= 17) {
            headlightIntensity = timeOfDay <= 7 ?
                (7 - timeOfDay) :
                (timeOfDay - 17);
        }

        if (headlightIntensity > 0) {
            this.drawHeadlights(width, length, headlightIntensity);
        }

        this.drawTaillights(width, length);

        this.ctx.restore();
    }

    drawHeadlights(width, length, intensity) {
        // Save composite operation
        this.ctx.globalCompositeOperation = 'lighter';

        // Outer glow
        this.ctx.beginPath();
        this.ctx.moveTo(-width / 4, -length / 2);
        this.ctx.lineTo(-width / 2 - 70, -length / 2 - 120);
        this.ctx.lineTo(width / 2 + 70, -length / 2 - 120);
        this.ctx.lineTo(width / 4, -length / 2);
        this.ctx.fillStyle = `rgba(255, 255, 200, ${0.025 * intensity})`;
        this.ctx.fill();

        // Main beam gradient
        const gradient = this.ctx.createRadialGradient(
            0, -length / 2,
            0,
            0, -length / 2 - 60,
            80
        );
        gradient.addColorStop(0, `rgba(255, 255, 220, ${0.5 * intensity})`);
        gradient.addColorStop(1, `rgba(255, 255, 220, 0)`);

        // Middle glow
        this.ctx.beginPath();
        this.ctx.moveTo(-width / 4, -length / 2);
        this.ctx.lineTo(-width / 2 - 50, -length / 2 - 100);
        this.ctx.lineTo(width / 2 + 50, -length / 2 - 100);
        this.ctx.lineTo(width / 4, -length / 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Headlight dots
        const leftGlow = this.ctx.createRadialGradient(
            -width / 4, -length / 2 + 2, 0,
            -width / 4, -length / 2 + 2, 8
        );
        leftGlow.addColorStop(0, `rgba(255, 255, 150, ${0.9 * intensity})`);
        leftGlow.addColorStop(1, `rgba(255, 255, 150, 0)`);

        const rightGlow = this.ctx.createRadialGradient(
            width / 4, -length / 2 + 2, 0,
            width / 4, -length / 2 + 2, 8
        );
        rightGlow.addColorStop(0, `rgba(255, 255, 150, ${0.9 * intensity})`);
        rightGlow.addColorStop(1, `rgba(255, 255, 150, 0)`);

        // Draw glows
        this.ctx.beginPath();
        this.ctx.arc(-width / 4, -length / 2 + 2, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = leftGlow;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(width / 4, -length / 2 + 2, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = rightGlow;
        this.ctx.fill();

        // Bright centers
        this.ctx.beginPath();
        this.ctx.arc(-width / 4, -length / 2 + 2, 3, 0, Math.PI * 2);
        this.ctx.arc(width / 4, -length / 2 + 2, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawTaillights(width, length) {
        const isBraking = this.gameState.car.acceleration < 0 ||
            (Math.abs(this.gameState.car.speed) > 0.1 && this.gameState.car.acceleration === 0);

        if (isBraking) {
            this.ctx.globalCompositeOperation = 'screen';

            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(-width / 4, length / 2 - 2, 8, 0, Math.PI * 2);
            this.ctx.arc(width / 4, length / 2 - 2, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = "rgba(255, 50, 50, 0.3)";
            this.ctx.fill();

            // Middle glow
            this.ctx.beginPath();
            this.ctx.arc(-width / 4, length / 2 - 2, 6, 0, Math.PI * 2);
            this.ctx.arc(width / 4, length / 2 - 2, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = "rgba(255, 50, 50, 0.5)";
            this.ctx.fill();

            this.ctx.globalCompositeOperation = 'lighter';

            // Bright center
            this.ctx.beginPath();
            this.ctx.arc(-width / 4, length / 2 - 2, 3, 0, Math.PI * 2);
            this.ctx.arc(width / 4, length / 2 - 2, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = "rgba(255, 50, 50, 1.0)";
            this.ctx.fill();
        } else {
            this.ctx.globalCompositeOperation = 'screen';

            // Regular glow
            this.ctx.beginPath();
            this.ctx.arc(-width / 4, length / 2 - 2, 6, 0, Math.PI * 2);
            this.ctx.arc(width / 4, length / 2 - 2, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = "rgba(255, 50, 50, 0.3)";
            this.ctx.fill();

            // Inner light
            this.ctx.beginPath();
            this.ctx.arc(-width / 4, length / 2 - 2, 3, 0, Math.PI * 2);
            this.ctx.arc(width / 4, length / 2 - 2, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = "rgba(255, 50, 50, 0.7)";
            this.ctx.fill();
        }

        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawParticles() {
        this.drawWaterSplashParticles();
        this.drawHandbrakeParticles();
        this.drawExhaustParticles();
        this.drawFireParticles();
    }

    drawWaterSplashParticles() {
        drawWaterSplashParticles(this.ctx, this.gameState);
    }

    drawHandbrakeParticles() {
        drawHandbrakeParticles(this.ctx, this.gameState);
    }

    drawExhaustParticles() {
        drawExhaustParticles(this.ctx, this.gameState);
    }

    drawFireParticles() {
        drawFireParticles(this.ctx, this.gameState);
    }
}

// Export the Renderer class
window.Renderer = Renderer; 