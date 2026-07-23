// server/src/services/sessionService.js
// ═══════════════════════════════════════════════════════════════════
// Refresh Token Session Store with Rotation & Revocation
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { redisService } from '../config/redisService.js';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export const sessionService = {
  async createSession(userId, role = 'driver') {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const session = {
      userId,
      role,
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    await redisService.set(`session:${refreshToken}`, session, REFRESH_TOKEN_TTL);
    return refreshToken;
  },

  async verifyAndRotateSession(oldRefreshToken) {
    const session = await redisService.get(`session:${oldRefreshToken}`);
    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Revoke old token
    await redisService.del(`session:${oldRefreshToken}`);

    // Generate rotated new token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newSession = {
      ...session,
      refreshToken: newRefreshToken,
      updatedAt: new Date().toISOString(),
    };

    await redisService.set(`session:${newRefreshToken}`, newSession, REFRESH_TOKEN_TTL);
    return { userId: session.userId, role: session.role, newRefreshToken };
  },

  async revokeSession(refreshToken) {
    await redisService.del(`session:${refreshToken}`);
    return true;
  },
};
