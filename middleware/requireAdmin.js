// middleware/requireAdmin.js
// Middleware die prüft ob der User Admin-Rechte hat

const requireAdmin = (req, res, next) => {
  // Benutzer muss authentifiziert sein (wird von authenticateToken gesetzt)
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Nicht authentifiziert' 
    });
  }

  // Prüfe Admin-Rolle
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Zugriff verweigert - Admin-Rechte erforderlich',
      message: 'Diese Aktion erfordert Administrator-Rechte'
    });
  }

  // User ist Admin - weiter zur nächsten Middleware/Route
  next();
};

module.exports = requireAdmin;
