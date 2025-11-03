const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// System Prompt für Claude
const SYSTEM_PROMPT = `Du bist ein hilfreicher Fußball-Assistent der Nutzern hilft, Spiele in einer PostgreSQL-Datenbank zu finden.

DATENBANK SCHEMA:
- matches: id, competition_id, home_team_id, away_team_id, home_team_name, away_team_name, utc_date, status, matchday, venue, full_time_home, full_time_away, half_time_home, half_time_away
- teams: id, name, crest, founded, venue
- competitions: id, name, code, emblem

WICHTIGE REGELN:
1. Generiere NUR SELECT Queries
2. Nutze IMMER LEFT JOINs für teams und competitions
3. Füge IMMER ein LIMIT hinzu (max 50)
4. Nutze ILIKE für Textsuche (case-insensitive)
5. Datum-Vergleiche mit DATE() oder BETWEEN

RESPONSE FORMAT (JSON):
{
  "intent": "find_matches",
  "sql": "SELECT m.*, ht.name as home_name, ...",
  "explanation": "Kurze Erklärung der Suche",
  "expectedCount": "geschätzte Anzahl"
}

BEISPIELE:

Frage: "Bayern Spiele heute"
{
  "intent": "find_matches",
  "sql": "SELECT m.*, c.name as comp_name, c.emblem FROM matches m LEFT JOIN competitions c ON m.competition_id = c.id WHERE (m.home_team_name ILIKE '%Bayern%' OR m.away_team_name ILIKE '%Bayern%') AND DATE(m.utc_date) = CURRENT_DATE ORDER BY m.utc_date LIMIT 50",
  "explanation": "Suche nach allen Bayern-Spielen heute",
  "expectedCount": "1-3"
}

Frage: "Champions League diese Woche"
{
  "intent": "find_matches",
  "sql": "SELECT m.*, c.name as comp_name, c.emblem FROM matches m LEFT JOIN competitions c ON m.competition_id = c.id WHERE c.name ILIKE '%Champions League%' AND m.utc_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' ORDER BY m.utc_date LIMIT 50",
  "explanation": "Champions League Spiele in den nächsten 7 Tagen",
  "expectedCount": "5-15"
}

Frage: "Wann spielt Real Madrid gegen Barcelona?"
{
  "intent": "find_matches",
  "sql": "SELECT m.*, c.name as comp_name, c.emblem FROM matches m LEFT JOIN competitions c ON m.competition_id = c.id WHERE ((m.home_team_name ILIKE '%Real Madrid%' AND m.away_team_name ILIKE '%Barcelona%') OR (m.home_team_name ILIKE '%Barcelona%' AND m.away_team_name ILIKE '%Real Madrid%')) ORDER BY m.utc_date DESC LIMIT 50",
  "explanation": "Suche nach Spielen zwischen Real Madrid und Barcelona",
  "expectedCount": "5-10"
}

Antworte IMMER im JSON Format!`;

// SQL Validation
function validateSQL(sql) {
  // 1. Nur SELECT erlauben (auch CTEs mit WITH)
  const upperSQL = sql.trim().toUpperCase();
  if (!upperSQL.startsWith('SELECT') && !upperSQL.startsWith('WITH')) {
    throw new Error('Nur SELECT queries sind erlaubt');
  }

  // 2. Gefährliche Keywords blockieren
  const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE', '--', ';--'];
  for (const keyword of dangerous) {
    if (upperSQL.includes(keyword)) {
      throw new Error(`Gefährliche Operation blockiert: ${keyword}`);
    }
  }

  // 3. Nur erlaubte Tabellen
  const allowedTables = ['matches', 'teams', 'competitions', 'standings', 'top_scorers'];
  const hasInvalidTable = !allowedTables.some(table => 
    upperSQL.includes(table.toUpperCase())
  );
  
  if (hasInvalidTable && !upperSQL.includes('FROM')) {
    throw new Error('Ungültige Tabelle in Query');
  }

  // 4. LIMIT hinzufügen wenn fehlt
  if (!upperSQL.includes('LIMIT')) {
    sql += ' LIMIT 50';
  }

  return sql;
}

// Hauptendpoint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Frage darf nicht leer sein' });
    }

    // Claude API Call
    console.log('Frage:', question);
    
    let message;
    try {
      console.log('Initiating API call to Anthropic...');
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: question
        }]
      });
      console.log('API call successful.');
    } catch (apiError) {
      console.error('API call failed:', apiError);
      throw apiError;
    }

    const responseText = message.content[0].text;
    console.log('Claude Response:', responseText);

    // Parse JSON Response
    let claudeResponse;
    try {
      // Extrahiere JSON aus der Antwort (falls Claude Text drumherum schreibt)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        claudeResponse = JSON.parse(jsonMatch[0]);
      } else {
        claudeResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(500).json({
        type: 'error',
        message: 'Konnte die Anfrage nicht verstehen. Bitte formuliere sie anders.',
        details: responseText
      });
    }

    // Validiere SQL
    const validatedSQL = validateSQL(claudeResponse.sql);
    console.log('Validated SQL:', validatedSQL);

    // Führe Query aus (mit Timeout)
    const queryPromise = pool.query(validatedSQL);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query Timeout')), 5000)
    );

    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Hole Stats für jedes Match (wie in matches.js)
    const matchesWithStats = await Promise.all(
      result.rows.map(async (match) => {
        try {
          // Home Team Stats
          const homeStats = await pool.query(`
            SELECT 
              COUNT(*) as total_games,
              ROUND(AVG(CASE WHEN full_time_home > 0 AND full_time_away > 0 THEN 100 ELSE 0 END)) as both_teams_score,
              ROUND(AVG(CASE WHEN full_time_home = 0 OR full_time_away = 0 THEN 100 ELSE 0 END)) as not_both_teams_score,
              ROUND(AVG(CASE WHEN (full_time_home + full_time_away) > 2.5 THEN 100 ELSE 0 END)) as over_25,
              ROUND(AVG(CASE WHEN (full_time_home + full_time_away) < 2.5 THEN 100 ELSE 0 END)) as under_25,
              ROUND(AVG(CASE WHEN winner = 'HOME_TEAM' THEN 100 ELSE 0 END)) as wins,
              ROUND(AVG(CASE WHEN winner = 'DRAW' THEN 100 ELSE 0 END)) as draws,
              ROUND(AVG(CASE WHEN winner = 'AWAY_TEAM' THEN 100 ELSE 0 END)) as losses
            FROM matches
            WHERE home_team_id = $1 
              AND status = 'FINISHED'
              AND utc_date < $2
            LIMIT 20
          `, [match.home_team_id, match.utc_date]);

          // Away Team Stats
          const awayStats = await pool.query(`
            SELECT 
              COUNT(*) as total_games,
              ROUND(AVG(CASE WHEN full_time_home > 0 AND full_time_away > 0 THEN 100 ELSE 0 END)) as both_teams_score,
              ROUND(AVG(CASE WHEN full_time_home = 0 OR full_time_away = 0 THEN 100 ELSE 0 END)) as not_both_teams_score,
              ROUND(AVG(CASE WHEN (full_time_home + full_time_away) > 2.5 THEN 100 ELSE 0 END)) as over_25,
              ROUND(AVG(CASE WHEN (full_time_home + full_time_away) < 2.5 THEN 100 ELSE 0 END)) as under_25,
              ROUND(AVG(CASE WHEN winner = 'AWAY_TEAM' THEN 100 ELSE 0 END)) as wins,
              ROUND(AVG(CASE WHEN winner = 'DRAW' THEN 100 ELSE 0 END)) as draws,
              ROUND(AVG(CASE WHEN winner = 'HOME_TEAM' THEN 100 ELSE 0 END)) as losses
            FROM matches
            WHERE away_team_id = $1 
              AND status = 'FINISHED'
              AND utc_date < $2
            LIMIT 20
          `, [match.away_team_id, match.utc_date]);

          return {
            ...match,
            homeTeam: {
              id: match.home_team_id,
              name: match.home_team_name,
              crest: match.home_crest || null,
              stats: homeStats.rows[0] || { totalGames: 0 }
            },
            awayTeam: {
              id: match.away_team_id,
              name: match.away_team_name,
              crest: match.away_crest || null,
              stats: awayStats.rows[0] || { totalGames: 0 }
            },
            competition: {
              id: match.competition_id,
              name: match.comp_name || 'Unbekannt',
              emblem: match.emblem || null
            },
            score: {
              fullTime: {
                home: match.full_time_home,
                away: match.full_time_away
              },
              halfTime: {
                home: match.half_time_home,
                away: match.half_time_away
              }
            }
          };
        } catch (err) {
          console.error('Error loading stats for match:', err);
          return match;
        }
      })
    );

    // Response
    res.json({
      type: 'matches',
      message: claudeResponse.explanation || `${matchesWithStats.length} Spiele gefunden`,
      matches: matchesWithStats,
      totalCount: matchesWithStats.length,
      sql: validatedSQL // Für Debugging
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    console.error('Detailed Error:', JSON.stringify(error, null, 2));
    
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        type: 'error',
        message: 'KI-Service nicht konfiguriert. Bitte Administrator kontaktieren.'
      });
    }

    if (error.message.includes('Timeout')) {
      return res.status(500).json({
        type: 'error',
        message: 'Die Anfrage hat zu lange gedauert. Bitte versuche es mit einer einfacheren Frage.'
      });
    }

    res.status(500).json({
      type: 'error',
      message: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      details: error.message
    });
  }
});

module.exports = router;
