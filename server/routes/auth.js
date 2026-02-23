import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import pool from '../config/db.js';
import { signToken, authenticate } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM users');
    const role = parseInt(countRows[0].count) === 0 ? 'admin' : 'user';

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
      [username.trim(), email.trim().toLowerCase(), passwordHash, role]
    );

    const user = rows[0];
    const token = signToken({ id: user.id, username: user.username, role: user.role });

    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') {
      const field = err.constraint?.includes('email') ? 'email' : 'username';
      return res.status(409).json({ error: `A user with this ${field} already exists` });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, (req, res) => {
  if (!req.user) return res.json(null);
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

export default router;
