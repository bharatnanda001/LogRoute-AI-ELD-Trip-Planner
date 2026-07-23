// server/src/routes/auth.js
// ═══════════════════════════════════════════════════════════════════
// Auth routes — register + login (Epic G1)
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { email, password, firstName, lastName, role? }
 *
 * Creates a user + driver profile (if role=driver).
 * Returns a JWT.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'driver' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'email, password, firstName, lastName are required' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
      [email, passwordHash, role]
    );
    const userId = userResult.rows[0].id;

    let driverId = null;

    // If driver, create a driver profile
    // (carrier assignment can be done later via admin)
    if (role === 'driver') {
      // For now, create without carrier — must be assigned later
      // In production, registration would include carrier selection
      const driverResult = await query(
        `INSERT INTO drivers (user_id, first_name, last_name, driver_license_number, driver_license_state, home_terminal_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, firstName, lastName, 'PENDING', 'XX', 'PENDING']
      );
      driverId = driverResult.rows[0].id;
    }

    const token = generateToken({ id: userId, email, role, driverId });

    res.status(201).json({
      token,
      user: { id: userId, email, role, driverId },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns a JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find user
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, d.id as driver_id, d.carrier_id
       FROM users u
       LEFT JOIN drivers d ON d.user_id = u.id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      driverId: user.driver_id,
      carrierId: user.carrier_id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        driverId: user.driver_id,
        carrierId: user.carrier_id,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
