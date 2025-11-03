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
app.use(express.json());   // Kann JSON-Daten verstehen
app.use(ipLogger);         // Loggt IP-Adresse bei jedem Request

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

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
