const WebSocket = require('ws');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected players
const players = new Map();

// Generate a random color for new players
function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

wss.on('connection', (ws) => {
    // Generate unique ID for new player
    const playerId = Math.random().toString(36).substring(7);

    // Initialize player
    const player = {
        id: playerId,
        color: getRandomColor(),
        x: 0,
        y: 0,
        rotation: 0,
        speed: 0,
        hp: 100,
        lightsOn: true
    };

    players.set(playerId, player);

    // Send initial player data
    ws.send(JSON.stringify({
        type: 'init',
        player: player,
        players: Array.from(players.values())
    }));

    // Broadcast new player to all other players
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'playerJoin',
                player: player
            }));
        }
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'update':
                    // Update player state
                    const player = players.get(playerId);
                    if (player) {
                        Object.assign(player, {
                            x: data.x,
                            y: data.y,
                            rotation: data.rotation,
                            speed: data.speed,
                            hp: data.hp,
                            lightsOn: data.lightsOn
                        });

                        // Broadcast player update to all other players
                        wss.clients.forEach((client) => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'playerUpdate',
                                    player: player
                                }));
                            }
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        // Remove player and broadcast their departure
        players.delete(playerId);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'playerLeave',
                    playerId: playerId
                }));
            }
        });
    });
});
