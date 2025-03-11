console.log('hello 1');

const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

console.log('Starting server initialization...');

// Serve static files from the root directory
app.use(express.static(__dirname));

const server = app.listen(port, '127.0.0.1', () => {
    console.log(`HTTP Server is running on port ${port}`);
    console.log(`WebSocket server will be available at ws://localhost:${port}`);
});

// Create WebSocket server with specific configuration
const wss = new WebSocket.Server({
    server,
    path: '/ws'  // Add specific path for WebSocket
});
console.log('WebSocket server created');

// Store connected players
const players = new Map();

// Generate a random color for new players
function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

wss.on('connection', (ws, req) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);

    // Generate unique ID for new player
    const playerId = Math.random().toString(36).substring(7);
    console.log(`Assigned player ID: ${playerId}`);

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
    console.log(`Total players connected: ${players.size}`);

    // Send initial player data
    ws.send(JSON.stringify({
        type: 'init',
        player: player,
        players: Array.from(players.values())
    }));
    console.log(`Sent initial data to player ${playerId}`);

    // Broadcast new player to all other players
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'playerJoin',
                player: player
            }));
        }
    });
    console.log(`Broadcasted new player ${playerId} to other players`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Received message from player ${playerId}:`, data.type);

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
        console.log(`Player ${playerId} disconnected`);
        // Remove player and broadcast their departure
        players.delete(playerId);
        console.log(`Remaining players: ${players.size}`);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'playerLeave',
                    playerId: playerId
                }));
            }
        });
        console.log(`Broadcasted player ${playerId} departure`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
    });
});

// Log any WebSocket server errors
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Regular status logging
setInterval(() => {
    console.log(`Server status - Connected players: ${players.size}`);
}, 30000);
