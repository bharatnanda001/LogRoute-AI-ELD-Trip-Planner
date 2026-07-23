// server/src/index.js
// ═══════════════════════════════════════════════════════════════════
// ELD Trip Planner — Production API Server with WebSocket & Redis Cache
// Render & Vercel Production Ready Deployment Configuration
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

// Allowed origins for CORS (Development & Vercel Production)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

// ── CORS Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive CORS for seamless Vercel/Render connection
    }
  },
  credentials: true,
}));

app.use(express.json());

// ── Health Check Endpoint for Render ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'LogRoute AI ELD Server',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Redis / In-Memory Cache Middleware for Dashboard ────────────
app.use('/api/eld/dashboard', async (req, res, next) => {
  const middleware = await redisService.cacheMiddleware(30);
  return middleware(req, res, next);
});

// ── Mount API Routes ─────────────────────────────────────────────
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

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start HTTP + WebSocket Server ────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 LogRoute AI Server running on port ${PORT}`);
  console.log(`📡 WebSocket telematics streaming active at ws://localhost:${PORT}/ws/telematics`);
});

export default app;
