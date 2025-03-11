class MultiplayerManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.otherPlayers = new Map();
        this.playerId = null;
        this.playerColor = null;
        this.connectToServer();
    }

    connectToServer() {
        // Connect to Cloudflare Worker
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Connected to game server');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from game server');
            // Try to reconnect after 5 seconds
            setTimeout(() => this.connectToServer(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'init':
                this.playerId = data.player.id;
                this.playerColor = data.player.color;
                // Initialize other players
                data.players.forEach(player => {
                    if (player.id !== this.playerId) {
                        this.otherPlayers.set(player.id, player);
                    }
                });
                break;

            case 'playerJoin':
                if (data.player.id !== this.playerId) {
                    this.otherPlayers.set(data.player.id, data.player);
                }
                break;

            case 'playerUpdate':
                if (data.player.id !== this.playerId) {
                    this.otherPlayers.set(data.player.id, data.player);
                }
                break;

            case 'playerLeave':
                this.otherPlayers.delete(data.playerId);
                break;
        }
    }

    updateServer() {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'update',
                x: this.gameState.car.x,
                y: this.gameState.car.y,
                rotation: this.gameState.car.rotation,
                speed: this.gameState.car.speed,
                hp: this.gameState.car.hp,
                lightsOn: this.gameState.car.lightsOn
            }));
        }
    }

    drawOtherPlayers(ctx) {
        this.otherPlayers.forEach(player => {
            // Save context
            ctx.save();

            // Transform context for this player
            ctx.translate(
                player.x - this.gameState.viewport.x,
                player.y - this.gameState.viewport.y
            );
            ctx.rotate(player.rotation);

            // Draw car body
            const width = this.gameState.car.width;
            const length = this.gameState.car.length;

            // Draw car with player's color
            ctx.fillStyle = player.color;
            ctx.fillRect(-width / 2, -length / 2, width, length);

            // Draw car details (simplified version)
            ctx.fillStyle = '#000000';
            ctx.fillRect(-width / 4, -length / 2, width / 2, length / 4); // windshield

            // Draw lights if they're on
            if (player.lightsOn) {
                // Headlights
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(-width / 4, -length / 2, 2, 0, Math.PI * 2);
                ctx.arc(width / 4, -length / 2, 2, 0, Math.PI * 2);
                ctx.fill();

                // Taillights
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(-width / 4, length / 2, 2, 0, Math.PI * 2);
                ctx.arc(width / 4, length / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Restore context
            ctx.restore();
        });
    }
}
