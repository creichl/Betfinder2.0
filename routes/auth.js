// routes/auth.js - Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// ==========================================
// POST /api/auth/register - Neuen User registrieren
// ==========================================
router.post('/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      // Validierung
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Prüfe ob User bereits existiert
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email oder Username bereits vergeben' });
      }

      // Hash Password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Erstelle User
      const newUser = await pool.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, first_name, last_name, role, created_at`,
        [username, email, passwordHash, firstName || null, lastName || null]
      );

      const user = newUser.rows[0];

      // Erstelle JWT Token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registrierung erfolgreich',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Register Error:', error);
      res.status(500).json({ error: 'Server-Fehler bei der Registrierung' });
    }
  }
);

// ==========================================
// POST /api/auth/login - User Login
// ==========================================
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      // Validierung
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Finde User
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      const user = result.rows[0];

      // Prüfe Password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Update last_login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Erstelle JWT Token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login erfolgreich',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ error: 'Server-Fehler beim Login' });
    }
  }
);

// ==========================================
// GET /api/auth/profile - Get User Profile (Protected)
// ==========================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });

  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// ==========================================
// PUT /api/auth/profile - Update User Profile (Protected)
// ==========================================
router.put('/profile', 
  authenticateToken,
  [
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('email').optional().isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email } = req.body;
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (firstName !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(lastName);
      }
      if (email !== undefined) {
        // Prüfe ob Email bereits verwendet wird
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, req.user.userId]
        );
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Email bereits vergeben' });
        }
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Keine Änderungen angegeben' });
      }

      values.push(req.user.userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, first_name, last_name, role`;

      const result = await pool.query(query, values);
      const user = result.rows[0];

      res.json({
        message: 'Profil erfolgreich aktualisiert',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ error: 'Server-Fehler beim Update' });
    }
  }
);

// ==========================================
// POST /api/auth/change-password - Change Password (Protected)
// ==========================================
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').exists(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Hole aktuellen User
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User nicht gefunden' });
      }

      // Prüfe aktuelles Password
      const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      }

      // Hash neues Password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update Password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, req.user.userId]
      );

      res.json({ message: 'Passwort erfolgreich geändert' });

    } catch (error) {
      console.error('Change Password Error:', error);
      res.status(500).json({ error: 'Server-Fehler beim Passwort-Wechsel' });
    }
  }
);

module.exports = router;
