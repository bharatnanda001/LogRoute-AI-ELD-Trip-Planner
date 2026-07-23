// server/tests/auth.test.js
// ═══════════════════════════════════════════════════════════════════
// Authentication & JWT Security Test Suite
// ═══════════════════════════════════════════════════════════════════

import { describe, test, expect } from '@jest/globals';
import { generateAccessToken, generateRefreshToken } from '../src/middleware/auth.js';

describe('Auth Middleware & Token Security', () => {
  test('generateAccessToken returns a valid JWT string', () => {
    const payload = { id: 'usr_123', email: 'driver@fleet.com', role: 'driver' };
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT format header.payload.signature
  });

  test('generateRefreshToken returns token, hash, and expiresAt date', () => {
    const { token, hash, expiresAt } = generateRefreshToken();
    expect(token).toBeDefined();
    expect(hash).toBeDefined();
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
