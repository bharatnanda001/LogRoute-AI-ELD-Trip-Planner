// server/src/services/websocketService.js
// ═══════════════════════════════════════════════════════════════════
// Real-Time Fleet WebSocket & Telematics Service
// ═══════════════════════════════════════════════════════════════════

import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws/telematics' });

  wss.on('connection', (ws, req) => {
    // Expect JWT token in query string, e.g., ws://host/ws/telematics?token=JWT
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(4001, 'Missing authentication token');
      return;
    }
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      ws.user = decoded; // attach user info for later use
    } catch (err) {
      ws.close(4002, 'Invalid authentication token');
      return;
    }
    clients.add(ws);
    console.log(`📡 WebSocket client connected (User: ${ws.user.id || 'unknown'}, Total: ${clients.size})`);

    ws.send(
      JSON.stringify({
        type: 'SYSTEM_CONNECTED',
        message: 'Real-time ELD Telematics Stream Connected',
        timestamp: new Date().toISOString(),
      })
    );

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        console.log('Received WS message:', payload.type);

        // Broadcast to all connected clients
        broadcastFleetEvent(payload.type, payload.data);
      } catch (err) {
        console.error('Invalid WS payload:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`📡 WebSocket client disconnected (Total: ${clients.size})`);
    });
  });

  return wss;
}

export function broadcastFleetEvent(type, data) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}
