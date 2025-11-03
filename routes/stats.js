const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/stats - Datenbankstatistiken
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Anzahl der Competitions
    const competitionsResult = await pool.query('SELECT COUNT(*) as count FROM competitions');
    const competitions = parseInt(competitionsResult.rows[0].count);

    // Anzahl der Teams
    const teamsResult = await pool.query('SELECT COUNT(*) as count FROM teams');
    const teams = parseInt(teamsResult.rows[0].count);

    // Anzahl der Matches
    const matchesResult = await pool.query('SELECT COUNT(*) as count FROM matches');
    const matches = parseInt(matchesResult.rows[0].count);

    // Anzahl der Seasons
    const seasonsResult = await pool.query('SELECT COUNT(*) as count FROM seasons');
    const seasons = parseInt(seasonsResult.rows[0].count);

    // Anzahl der Players (Spieler)
    const playersResult = await pool.query('SELECT COUNT(*) as count FROM players');
    const players = parseInt(playersResult.rows[0].count);

    res.json({
      competitions,
      teams,
      matches,
      seasons,
      players
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Statistiken' });
  }
});

module.exports = router;
