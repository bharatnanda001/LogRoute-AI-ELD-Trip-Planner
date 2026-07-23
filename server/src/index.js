// server/src/index.js
// ═══════════════════════════════════════════════════════════════════
// ELD Trip Planner — Production API Server with WebSocket & Redis Cache
// ═══════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { redisService } from './config/redisService.js';
import { initWebSocketServer } from './services/websocketService.js';

import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import eldRoutes from './routes/eldRoutes.js';
import gpsRoutes from './routes/gps.js';
import eventRoutes from './routes/events.js';
import dvirRoutes from './routes/dvir.js';
import certRoutes from './routes/certifications.js';
import diagRoutes from './routes/diagnostics.js';
import syncRoutes from './routes/sync.js';
import aiRoutes from './routes/ai.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket Telematics Broadcast Server
initWebSocketServer(server);

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(express.json());

// ── Request logging (dev only) ───────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// ── Redis / In-Memory Cache Middleware for GET routes ───────────
app.use('/api/eld/dashboard', async (req, res, next) => {
  const middleware = await redisService.cacheMiddleware(30);
  middleware(req, res, next);
});

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/eld', eldRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dvir', dvirRoutes);
app.use('/api/certifications', certRoutes);
app.use('/api/diagnostics', diagRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ai', aiRoutes);

// ── Root landing route ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'LogRoute AI — ELD Trip Planner API Server',
    version: '1.0.0',
    status: 'online',
    systemArchitecture: {
      cache: 'Redis / In-Memory TTL Store (Active)',
      webSocket: 'ws://localhost:' + PORT + '/ws/telematics (Active)',
      fmcsaEngine: '@eld/shared-hos (Active)',
    },
    timestamp: new Date().toISOString(),
    documentation: 'FMCSA 49 CFR Part 395 Hours of Service Compliance Engine',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login, POST /api/auth/register, POST /api/auth/refresh',
      trips: 'POST /api/trips, POST /api/trips/preview',
      eld: 'GET /api/eld/dashboard, GET /api/eld/drivers/:id',
      gps: 'POST /api/gps/batch, GET /api/gps/history',
      ws: 'ws://localhost:' + PORT + '/ws/telematics',
    },
    frontendAppUrl: 'http://localhost:5173',
  });
});

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cache: 'online', websocket: 'online', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start HTTP + WebSocket server ─────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚛 ELD Trip Planner API running on http://localhost:${PORT}`);
  console.log(`   WebSocket Telematics: ws://localhost:${PORT}/ws/telematics`);
  console.log(`   Redis Cache: Active\n`);
});
