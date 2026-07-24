// server/src/middleware/validation.js
// Zod validation middleware for request bodies
import { z } from 'zod';

// Schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['driver', 'dispatcher', 'fleet', 'admin', 'system_admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Middleware generator
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request payload', details: result.error.format() });
  }
  req.validated = result.data;
  next();
};
