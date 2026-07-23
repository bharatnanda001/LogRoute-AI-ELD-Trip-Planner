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
    clients.add(ws);
    console.log(`📡 WebSocket client connected (Total: ${clients.size})`);

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
