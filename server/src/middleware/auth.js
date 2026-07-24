// server/src/middleware/auth.js
// ═══════════════════════════════════════════════════════════════════
// JWT Authentication Middleware — Access + Refresh Token System
// Access Token: 15-min TTL, sent via Authorization header
// Refresh Token: 30-day TTL, stored as HttpOnly Secure cookie
// ═══════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_in_prod';
if (!process.env.JWT_SECRET) {
  console.warn('[Warning] JWT_SECRET not found in env, using fallback secret for development');
}
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

/**
 * Generate a short-lived access token (15 minutes).
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * Generate a long-lived refresh token (30 days).
 * Returns { token, hash, expiresAt }.
 */
export function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

/**
 * Hash a refresh token for comparison.
 */
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Legacy alias — kept for backward compat.
 */
export function generateToken(payload) {
  return generateAccessToken(payload);
}

/**
 * Set the refresh token as an HttpOnly Secure cookie.
 */
export function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

/**
 * Authentication middleware.
 * Checks for `Authorization: Bearer <token>` header.
 * If valid, attaches `req.user` with the decoded payload.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing auth header' });
  }
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Malformed auth header' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Optional authentication — does not fail if no token present.
 * Sets req.user if a valid token is found, otherwise continues.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next();

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_) {
    // Silently continue without user
  }
  next();
}
