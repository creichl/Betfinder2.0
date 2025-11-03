// Importiere die benötigten Pakete
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const aiChatRoutes = require('./routes/ai-chat');

// Erstelle eine Express-App
const app = express();
const PORT = 3001;

// Middleware (=Hilfsfunktionen die bei jeder Anfrage laufen)
app.use(cors());           // Erlaubt Anfragen von anderen Adressen
app.use(express.json());   // Kann JSON-Daten verstehen

// Routen
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/ai-chat', aiChatRoutes);

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
