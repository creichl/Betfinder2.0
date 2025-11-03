// middleware/auth.js - JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware um JWT Token zu verifizieren
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden - Zugriff verweigert' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // { userId, username, email, role }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Ungültiger Token' });
  }
};

// Optional: Middleware für Admin-Zugriff
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
