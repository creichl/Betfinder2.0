// routes/admin.js - Admin Routes für User-Verwaltung und Logs
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { logActivity, ACTION_TYPES } = require('../services/logger');

// Alle Admin-Routes erfordern Admin-Rechte
router.use(authenticateToken, requireAdmin);

// ==========================================
// GET /api/admin/users - Alle User abrufen
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status !== 'all') {
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    // Hole Users mit Pagination
    queryParams.push(limit, offset);
    const usersResult = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, status, is_active, created_at, last_login
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      queryParams
    );

    // Hole Gesamt-Anzahl
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      queryParams.slice(0, -2) // Ohne LIMIT und OFFSET
    );

    res.json({
      users: usersResult.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der User' });
  }
});

// ==========================================
// PUT /api/admin/users/:id - User bearbeiten
// ==========================================
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, status } = req.body;

    // Baue Update Query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      // Check ob Email bereits existiert
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email bereits vergeben' });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (role !== undefined && ['user', 'admin'].includes(role)) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      // Auch is_active aktualisieren
      updates.push(`is_active = $${paramCount++}`);
      values.push(status === 'active');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Keine Änderungen angegeben' });
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, username, email, first_name, last_name, role, status, is_active
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    const user = result.rows[0];

    // Log User-Edit
    await logActivity(
      req.user.userId, 
      ACTION_TYPES.USER_EDIT, 
      `Edited user ${user.username} (ID: ${id})`, 
      req.clientIp
    );

    res.json({
      message: 'User erfolgreich aktualisiert',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        isActive: user.is_active
      }
    });

  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Users' });
  }
});

// ==========================================
// DELETE /api/admin/users/:id - User deaktivieren
// ==========================================
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Selbst-Löschung verhindern
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Du kannst dich nicht selbst deaktivieren' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET status = 'inactive', is_active = false 
       WHERE id = $1 
       RETURNING username`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    // Log Status-Änderung
    await logActivity(
      req.user.userId, 
      ACTION_TYPES.USER_STATUS_CHANGE, 
      `Deactivated user ${result.rows[0].username} (ID: ${id})`, 
      req.clientIp
    );

    res.json({ message: 'User erfolgreich deaktiviert' });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Fehler beim Deaktivieren des Users' });
  }
});

// ==========================================
// GET /api/admin/logs - Activity Logs abrufen
// ==========================================
router.get('/logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      actionType = 'all', 
      userId = 'all',
      startDate,
      endDate
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 1;

    if (actionType !== 'all') {
      whereClause += ` AND l.action_type = $${paramCount}`;
      queryParams.push(actionType);
      paramCount++;
    }

    if (userId !== 'all' && userId) {
      whereClause += ` AND l.user_id = $${paramCount}`;
      queryParams.push(userId);
      paramCount++;
    }

    if (startDate) {
      whereClause += ` AND l.created_at >= $${paramCount}`;
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND l.created_at <= $${paramCount}`;
      queryParams.push(endDate);
      paramCount++;
    }

    // Hole Logs mit User-Info
    queryParams.push(limit, offset);
    const logsResult = await pool.query(
      `SELECT 
        l.id, 
        l.user_id, 
        u.username, 
        u.email,
        l.action_type, 
        l.details, 
        l.ip_address, 
        l.created_at
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      queryParams
    );

    // Hole Gesamt-Anzahl
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM activity_logs l WHERE ${whereClause}`,
      queryParams.slice(0, -2)
    );

    res.json({
      logs: logsResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get Logs Error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Logs' });
  }
});

// ==========================================
// GET /api/admin/stats - Admin Dashboard Stats
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    // User-Statistiken
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days') as new_users_30d
      FROM users
    `);

    // Activity-Statistiken
    const activityStats = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as logs_7d,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '24 hours') as logs_24h,
        COUNT(*) FILTER (WHERE action_type = 'LOGIN') as total_logins,
        COUNT(*) FILTER (WHERE action_type = 'AI_QUERY') as total_ai_queries
      FROM activity_logs
    `);

    // Letzte Logins
    const recentLogins = await pool.query(`
      SELECT DISTINCT ON (user_id)
        u.username,
        u.email,
        l.created_at,
        l.ip_address
      FROM activity_logs l
      JOIN users u ON l.user_id = u.id
      WHERE l.action_type = 'LOGIN'
      ORDER BY user_id, l.created_at DESC
      LIMIT 10
    `);

    res.json({
      users: userStats.rows[0],
      activity: activityStats.rows[0],
      recentLogins: recentLogins.rows
    });

  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});

module.exports = router;
