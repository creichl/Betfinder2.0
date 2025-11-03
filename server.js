// Importiere die benötigten Pakete
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ipLogger = require('./middleware/ip-logger');
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const aiChatRoutes = require('./routes/ai-chat');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

// Erstelle eine Express-App
const app = express();
const PORT = 3001;

// Middleware (=Hilfsfunktionen die bei jeder Anfrage laufen)
app.use(cors());           // Erlaubt Anfragen von anderen Adressen
app.use(express.json({ charset: 'utf-8' }));   // JSON mit UTF-8 Encoding
app.use(ipLogger);         // Loggt IP-Adresse bei jedem Request

// UTF-8 Content-Type Header für alle Responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Erste Test-Route
app.get('/', (req, res) => {
  res.json({
    message: 'Fußball-Analyzer API läuft!',
    version: '1.0.0'
  });
});

// Test-Route für UTF-8 Encoding (ohne Auth)
app.get('/api/test-encoding', async (req, res) => {
  try {
    const { pool } = require('./database');
    const result = await pool.query(
      "SELECT name FROM teams WHERE name LIKE '%Bayern%' OR name LIKE '%Köln%' OR name LIKE '%Nürnberg%' LIMIT 5"
    );
    res.json({ teams: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
