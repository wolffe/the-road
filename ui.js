// UI and notification functions
function showNotification(message, duration = 2000) {
    const notif = document.getElementById('notifications');
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, duration);
}

function updateUI(gameState) {
    // Update health bar
    document.getElementById('hpText').textContent = Math.round(gameState.car.hp);
    document.getElementById('hpBarFill').style.width = `${gameState.car.hp}%`;

    // Update fuel gauge
    document.getElementById('fuelText').textContent = Math.round(gameState.car.fuel);
    document.getElementById('fuelBarFill').style.width = `${gameState.car.fuel}%`;

    // Update battery indicator
    document.getElementById('batteryText').textContent = Math.round(gameState.car.battery);
    document.getElementById('batteryBarFill').style.width = `${gameState.car.battery}%`;

    // Update speed and position
    document.getElementById('speedText').textContent = Math.abs(Math.round(gameState.car.speed * 50));
    document.getElementById('posX').textContent = Math.round(gameState.car.x);
    document.getElementById('posY').textContent = Math.round(gameState.car.y);

    // Update terrain info
    const carTerrain = getCurrentTerrain(gameState);
    document.getElementById('terrainText').textContent = carTerrain ? carTerrain.type : 'unknown';

    // Update trunk info
    document.getElementById('trunkText').textContent = gameState.car.trunk;
    document.getElementById('maxTrunkText').textContent = gameState.car.maxTrunk;
    document.getElementById('trunkFuelText').textContent = gameState.car.trunkFuel;
    document.getElementById('maxTrunkFuelText').textContent = gameState.car.maxTrunkFuel;
    document.getElementById('trunkBatteryText').textContent = gameState.car.trunkBattery;
    document.getElementById('maxTrunkBatteryText').textContent = gameState.car.maxTrunkBattery;

    // Update HP bar color
    const hpBarFill = document.getElementById('hpBarFill');
    if (gameState.car.hp > 60) {
        hpBarFill.style.background = '#0f0';
    } else if (gameState.car.hp > 30) {
        hpBarFill.style.background = '#ff0';
    } else {
        hpBarFill.style.background = '#f00';
    }

    // Update time display
    updateTimeDisplay(gameState);
}

function updateTimeDisplay(gameState) {
    const timeOfDay = gameState.time.current * 24;

    // Update time text
    const hours = Math.floor(timeOfDay);
    const minutes = Math.floor((timeOfDay * 60) % 60);
    document.getElementById('timeText').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Update day phase text
    let dayPhase;
    if (timeOfDay >= 5 && timeOfDay < 8) dayPhase = "Dawn";
    else if (timeOfDay >= 8 && timeOfDay < 12) dayPhase = "Morning";
    else if (timeOfDay >= 12 && timeOfDay < 14) dayPhase = "Noon";
    else if (timeOfDay >= 14 && timeOfDay < 17) dayPhase = "Afternoon";
    else if (timeOfDay >= 17 && timeOfDay < 20) dayPhase = "Dusk";
    else if (timeOfDay >= 20 || timeOfDay < 5) dayPhase = "Night";
    document.getElementById('dayPhaseText').textContent = dayPhase;
}

function updateTotalTimeDisplay(gameState) {
    const timeElement = document.getElementById('totalTime');
    if (timeElement) {
        const hours = Math.floor(gameState.time.totalSeconds / 3600);
        const minutes = Math.floor((gameState.time.totalSeconds % 3600) / 60);
        const seconds = Math.floor(gameState.time.totalSeconds % 60);
        timeElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateDistanceDisplay(gameState) {
    const distanceElement = document.getElementById('totalDistance');
    if (distanceElement) {
        distanceElement.textContent = gameState.stats.totalDistance.toFixed(2);
    }
}

function updateArtifactsDisplay(gameState) {
    const artifactsList = document.getElementById('artifactsList');
    if (!artifactsList) return;

    artifactsList.innerHTML = '';
    gameState.stats.artifactsCollected.forEach(artifact => {
        const artifactDiv = document.createElement('div');
        artifactDiv.style.marginBottom = '5px';
        artifactDiv.style.padding = '5px';
        artifactDiv.style.background = 'rgba(255, 255, 255, 0.1)';
        artifactDiv.style.borderRadius = '3px';

        const date = new Date(artifact.collectedAt);
        const timeStr = date.toLocaleTimeString();
        const dateStr = date.toLocaleDateString();

        artifactDiv.innerHTML = `
            <strong>${artifact.name}</strong><br>
            <small>Collected: ${dateStr} ${timeStr}</small>
        `;
        artifactsList.appendChild(artifactDiv);
    });
}

function setupEventListeners(gameState) {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;

        // Handle one-time key presses here
        if (e.key.toLowerCase() === 'l') {
            gameState.car.lightsOn = !gameState.car.lightsOn;
            document.getElementById('lightsStatus').textContent = gameState.car.lightsOn ? 'ON' : 'OFF';
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });

    // Save game button
    document.getElementById('saveGameBtn').addEventListener('click', () => {
        saveGame(gameState);
        showNotification('Game saved!');
    });

    // Erase save button
    document.getElementById('eraseSaveBtn').addEventListener('click', () => {
        eraseSave(gameState);
        showNotification('Save data erased!');
    });

    // Auto-save before page unload
    window.addEventListener('beforeunload', () => {
        saveGame(gameState);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}

function initializeUI(canvas) {
    // Set canvas size to full window minus panel width
    canvas.width = window.innerWidth - 240; // 200px panel + 40px padding
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    // Enable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    return ctx;
}

function resizeCanvas(canvas, ctx) {
    canvas.width = window.innerWidth - 240; // 200px panel + 40px padding
    canvas.height = window.innerHeight;

    // Ensure smoothing remains enabled after resize
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

// Helper function to get current terrain
function getCurrentTerrain(gameState) {
    return gameState.terrain.find(point => {
        const dx = point.x - gameState.car.x;
        const dy = point.y - gameState.car.y;
        return Math.sqrt(dx * dx + dy * dy) < point.size / 2;
    });
}

// UI Manager class to handle all UI-related functionality
class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.setupNotifications();
        this.setupGameOverOverlay();
        this.setupStatusPanel();
    }

    setupNotifications() {
        this.notifications = document.getElementById('notifications');
    }

    setupGameOverOverlay() {
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.gameOverReason = document.getElementById('gameOverReason');
        this.gameOverTime = document.getElementById('gameOverTime');
        this.gameOverDistance = document.getElementById('gameOverDistance');
        this.gameOverArtifacts = document.getElementById('gameOverArtifacts');
    }

    setupStatusPanel() {
        // Get all status elements
        this.statusElements = {
            hp: document.getElementById('hpText'),
            hpBar: document.getElementById('hpBarFill'),
            fuel: document.getElementById('fuelText'),
            fuelBar: document.getElementById('fuelBarFill'),
            battery: document.getElementById('batteryText'),
            batteryBar: document.getElementById('batteryBarFill'),
            speed: document.getElementById('speedText'),
            posX: document.getElementById('posX'),
            posY: document.getElementById('posY'),
            terrain: document.getElementById('terrainText'),
            trunk: document.getElementById('trunkText'),
            maxTrunk: document.getElementById('maxTrunkText'),
            trunkFuel: document.getElementById('trunkFuelText'),
            maxTrunkFuel: document.getElementById('maxTrunkFuelText'),
            trunkBattery: document.getElementById('trunkBatteryText'),
            maxTrunkBattery: document.getElementById('maxTrunkBatteryText'),
            time: document.getElementById('timeText'),
            dayPhase: document.getElementById('dayPhaseText'),
            totalTime: document.getElementById('totalTime'),
            totalDistance: document.getElementById('totalDistance'),
            lightsStatus: document.getElementById('lightsStatus'),
            artifactsList: document.getElementById('artifactsList')
        };
    }

    showNotification(message, duration = 2000) {
        if (!this.notifications) return;

        this.notifications.textContent = message;
        this.notifications.style.display = 'block';
        setTimeout(() => {
            this.notifications.style.display = 'none';
        }, duration);
    }

    updateStatusPanel(carTerrain) {
        const car = this.gameState.car;

        // Update basic stats
        this.statusElements.hp.textContent = Math.round(car.hp);
        this.statusElements.hpBar.style.width = `${car.hp}%`;
        this.statusElements.fuel.textContent = Math.round(car.fuel);
        this.statusElements.fuelBar.style.width = `${car.fuel}%`;
        this.statusElements.battery.textContent = Math.round(car.battery);
        this.statusElements.batteryBar.style.width = `${car.battery}%`;
        this.statusElements.speed.textContent = Math.abs(Math.round(car.speed * 50));
        this.statusElements.posX.textContent = Math.round(car.x);
        this.statusElements.posY.textContent = Math.round(car.y);
        this.statusElements.terrain.textContent = carTerrain ? carTerrain.type : 'unknown';

        // Update trunk info
        this.statusElements.trunk.textContent = car.trunk;
        this.statusElements.maxTrunk.textContent = car.maxTrunk;
        this.statusElements.trunkFuel.textContent = car.trunkFuel;
        this.statusElements.maxTrunkFuel.textContent = car.maxTrunkFuel;
        this.statusElements.trunkBattery.textContent = car.trunkBattery;
        this.statusElements.maxTrunkBattery.textContent = car.maxTrunkBattery;

        // Update HP bar color
        if (car.hp > 60) {
            this.statusElements.hpBar.style.background = '#0f0';
        } else if (car.hp > 30) {
            this.statusElements.hpBar.style.background = '#ff0';
        } else {
            this.statusElements.hpBar.style.background = '#f00';
        }
    }

    updateTimeDisplay() {
        const timeOfDay = this.gameState.time.current * 24;
        let dayPhase;

        if (timeOfDay >= 5 && timeOfDay < 8) dayPhase = "Dawn";
        else if (timeOfDay >= 8 && timeOfDay < 12) dayPhase = "Morning";
        else if (timeOfDay >= 12 && timeOfDay < 14) dayPhase = "Noon";
        else if (timeOfDay >= 14 && timeOfDay < 17) dayPhase = "Afternoon";
        else if (timeOfDay >= 17 && timeOfDay < 20) dayPhase = "Dusk";
        else if (timeOfDay >= 20 || timeOfDay < 5) dayPhase = "Night";

        this.statusElements.dayPhase.textContent = dayPhase;

        // Update clock time
        const hours = Math.floor(timeOfDay);
        const minutes = Math.floor((timeOfDay * 60) % 60);
        this.statusElements.time.textContent =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    updateTotalTime() {
        const hours = Math.floor(this.gameState.time.totalSeconds / 3600);
        const minutes = Math.floor((this.gameState.time.totalSeconds % 3600) / 60);
        const seconds = Math.floor(this.gameState.time.totalSeconds % 60);
        this.statusElements.totalTime.textContent =
            `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTotalDistance() {
        this.statusElements.totalDistance.textContent =
            this.gameState.stats.totalDistance.toFixed(2);
    }

    updateArtifactsDisplay() {
        if (!this.statusElements.artifactsList) return;

        this.statusElements.artifactsList.innerHTML = '';
        this.gameState.stats.artifactsCollected.forEach(artifact => {
            const artifactDiv = document.createElement('div');
            artifactDiv.style.marginBottom = '5px';
            artifactDiv.style.padding = '5px';
            artifactDiv.style.background = 'rgba(255, 255, 255, 0.1)';
            artifactDiv.style.borderRadius = '3px';

            const date = new Date(artifact.collectedAt);
            const timeStr = date.toLocaleTimeString();
            const dateStr = date.toLocaleDateString();

            artifactDiv.innerHTML = `
                <strong>${artifact.name}</strong><br>
                <small>Collected: ${dateStr} ${timeStr}</small>
            `;
            this.statusElements.artifactsList.appendChild(artifactDiv);
        });
    }

    showGameOver(reason) {
        let reasonText = '';
        switch (reason) {
            case 'hp':
                reasonText = 'Your vehicle has been destroyed';
                break;
            case 'fuel':
                reasonText = 'Out of fuel - engine stopped';
                break;
            case 'battery':
                reasonText = 'Battery depleted - systems offline';
                break;
        }
        this.gameOverReason.textContent = reasonText;

        // Set statistics
        const hours = Math.floor(this.gameState.time.totalSeconds / 3600);
        const minutes = Math.floor((this.gameState.time.totalSeconds % 3600) / 60);
        const seconds = Math.floor(this.gameState.time.totalSeconds % 60);
        this.gameOverTime.textContent =
            `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.gameOverDistance.textContent =
            this.gameState.stats.totalDistance.toFixed(2);
        this.gameOverArtifacts.textContent =
            this.gameState.stats.artifactsCollected.length;

        // Show overlay
        this.gameOverOverlay.style.display = 'block';
    }

    hideGameOver() {
        this.gameOverOverlay.style.display = 'none';
    }

    updateLightsStatus() {
        this.statusElements.lightsStatus.textContent =
            this.gameState.car.lightsOn ? 'ON' : 'OFF';
    }
}

// Export the UIManager class
window.UIManager = UIManager; 