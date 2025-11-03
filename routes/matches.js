const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/matches - Alle Spiele mit optionaler Datumsfilterung
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, competitionId, teamId, status } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.utc_date,
        m.status,
        m.matchday,
        m.stage,
        m.group_name,
        m.winner,
        m.duration,
        m.venue,
        m.season_start_date,
        
        -- Heimteam
        m.home_team_id,
        m.home_team_name,
        ht.short_name as home_team_short_name,
        ht.tla as home_team_tla,
        ht.crest as home_team_crest,
        
        -- Auswärtsteam
        m.away_team_id,
        m.away_team_name,
        at.short_name as away_team_short_name,
        at.tla as away_team_tla,
        at.crest as away_team_crest,
        
        -- Wettbewerb
        c.id as competition_id,
        c.name as competition_name,
        c.code as competition_code,
        c.emblem as competition_emblem,
        c.type as competition_type,
        c.area_name,
        c.area_code,
        
        -- Schiedsrichter
        m.referee_name,
        m.referee_nationality,
        
        -- Ergebnisse
        m.full_time_home,
        m.full_time_away,
        m.half_time_home,
        m.half_time_away,
        m.last_updated
        
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN competitions c ON m.competition_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Datumsfilter
    if (startDate) {
      query += ` AND m.utc_date >= $${paramCount}::date`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      // Bis zum Ende des Tages (23:59:59)
      query += ` AND m.utc_date < ($${paramCount}::date + interval '1 day')`;
      params.push(endDate);
      paramCount++;
    }
    
    // Wettbewerbsfilter
    if (competitionId) {
      query += ` AND m.competition_id = $${paramCount}`;
      params.push(competitionId);
      paramCount++;
    }
    
    // Teamfilter
    if (teamId) {
      query += ` AND (m.home_team_id = $${paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(teamId);
      paramCount++;
    }
    
    // Statusfilter
    if (status) {
      query += ` AND m.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY m.utc_date DESC`;
    
    const result = await pool.query(query, params);
    
    // Berechne Statistiken für jedes Match
    const matchesWithStats = await Promise.all(result.rows.map(async (row) => {
      // Statistiken für Heimteam (Heimspiele)
      const homeStatsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN full_time_home > 0 AND full_time_away > 0 THEN 1 ELSE 0 END) as both_scored,
          SUM(CASE WHEN (full_time_home = 0 OR full_time_away = 0) THEN 1 ELSE 0 END) as not_both_scored,
          SUM(CASE WHEN (full_time_home + full_time_away) > 2 THEN 1 ELSE 0 END) as over_25,
          SUM(CASE WHEN (full_time_home + full_time_away) < 3 THEN 1 ELSE 0 END) as under_25,
          SUM(CASE WHEN full_time_home > full_time_away THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN full_time_home = full_time_away THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN full_time_home < full_time_away THEN 1 ELSE 0 END) as losses
        FROM matches
        WHERE home_team_id = $1 
          AND status = 'FINISHED'
          AND full_time_home IS NOT NULL
      `;
      
      // Statistiken für Auswärtsteam (Auswärtsspiele)
      const awayStatsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN full_time_home > 0 AND full_time_away > 0 THEN 1 ELSE 0 END) as both_scored,
          SUM(CASE WHEN (full_time_home = 0 OR full_time_away = 0) THEN 1 ELSE 0 END) as not_both_scored,
          SUM(CASE WHEN (full_time_home + full_time_away) > 2 THEN 1 ELSE 0 END) as over_25,
          SUM(CASE WHEN (full_time_home + full_time_away) < 3 THEN 1 ELSE 0 END) as under_25,
          SUM(CASE WHEN full_time_away > full_time_home THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN full_time_away = full_time_home THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN full_time_away < full_time_home THEN 1 ELSE 0 END) as losses
        FROM matches
        WHERE away_team_id = $1 
          AND status = 'FINISHED'
          AND full_time_away IS NOT NULL
      `;
      
      const homeStats = await pool.query(homeStatsQuery, [row.home_team_id]);
      const awayStats = await pool.query(awayStatsQuery, [row.away_team_id]);
      
      const homeTotal = parseInt(homeStats.rows[0]?.total || 0);
      const awayTotal = parseInt(awayStats.rows[0]?.total || 0);
      
      const homeBothScored = parseInt(homeStats.rows[0]?.both_scored || 0);
      const homeNotBothScored = parseInt(homeStats.rows[0]?.not_both_scored || 0);
      const homeOver25 = parseInt(homeStats.rows[0]?.over_25 || 0);
      const homeUnder25 = parseInt(homeStats.rows[0]?.under_25 || 0);
      const homeWins = parseInt(homeStats.rows[0]?.wins || 0);
      const homeDraws = parseInt(homeStats.rows[0]?.draws || 0);
      const homeLosses = parseInt(homeStats.rows[0]?.losses || 0);
      
      const awayBothScored = parseInt(awayStats.rows[0]?.both_scored || 0);
      const awayNotBothScored = parseInt(awayStats.rows[0]?.not_both_scored || 0);
      const awayOver25 = parseInt(awayStats.rows[0]?.over_25 || 0);
      const awayUnder25 = parseInt(awayStats.rows[0]?.under_25 || 0);
      const awayWins = parseInt(awayStats.rows[0]?.wins || 0);
      const awayDraws = parseInt(awayStats.rows[0]?.draws || 0);
      const awayLosses = parseInt(awayStats.rows[0]?.losses || 0);
      
      return {
        id: row.id,
        utcDate: row.utc_date,
        status: row.status,
        matchday: row.matchday,
        stage: row.stage,
        group: row.group_name,
        winner: row.winner,
        duration: row.duration,
        venue: row.venue,
        lastUpdated: row.last_updated,
        
        homeTeam: {
          id: row.home_team_id,
          name: row.home_team_name,
          shortName: row.home_team_short_name,
          tla: row.home_team_tla,
          crest: row.home_team_crest,
          stats: {
            bothTeamsScore: homeTotal > 0 ? Math.round((homeBothScored / homeTotal) * 100) : 0,
            notBothTeamsScore: homeTotal > 0 ? Math.round((homeNotBothScored / homeTotal) * 100) : 0,
            over25: homeTotal > 0 ? Math.round((homeOver25 / homeTotal) * 100) : 0,
            under25: homeTotal > 0 ? Math.round((homeUnder25 / homeTotal) * 100) : 0,
            wins: homeTotal > 0 ? Math.round((homeWins / homeTotal) * 100) : 0,
            draws: homeTotal > 0 ? Math.round((homeDraws / homeTotal) * 100) : 0,
            losses: homeTotal > 0 ? Math.round((homeLosses / homeTotal) * 100) : 0,
            totalGames: homeTotal
          }
        },
        
        awayTeam: {
          id: row.away_team_id,
          name: row.away_team_name,
          shortName: row.away_team_short_name,
          tla: row.away_team_tla,
          crest: row.away_team_crest,
          stats: {
            bothTeamsScore: awayTotal > 0 ? Math.round((awayBothScored / awayTotal) * 100) : 0,
            notBothTeamsScore: awayTotal > 0 ? Math.round((awayNotBothScored / awayTotal) * 100) : 0,
            over25: awayTotal > 0 ? Math.round((awayOver25 / awayTotal) * 100) : 0,
            under25: awayTotal > 0 ? Math.round((awayUnder25 / awayTotal) * 100) : 0,
            wins: awayTotal > 0 ? Math.round((awayWins / awayTotal) * 100) : 0,
            draws: awayTotal > 0 ? Math.round((awayDraws / awayTotal) * 100) : 0,
            losses: awayTotal > 0 ? Math.round((awayLosses / awayTotal) * 100) : 0,
            totalGames: awayTotal
          }
        },
        
        competition: {
          id: row.competition_id,
          name: row.competition_name,
          code: row.competition_code,
          emblem: row.competition_emblem,
          type: row.competition_type
        },
        
        season: {
          startDate: row.season_start_date
        },
        
        area: {
          name: row.area_name,
          code: row.area_code
        },
        
        score: {
          fullTime: {
            home: row.full_time_home,
            away: row.full_time_away
          },
          halfTime: {
            home: row.half_time_home,
            away: row.half_time_away
          }
        }
      };
    }));
    
    res.json({
      count: matchesWithStats.length,
      matches: matchesWithStats
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Spiele:', error);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der Spiele',
      details: error.message 
    });
  }
});

// GET /api/matches/:id - Einzelnes Spiel mit allen Details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hauptdaten des Spiels
    const matchQuery = `
      SELECT 
        m.*,
        
        ht.short_name as home_team_short_name,
        ht.tla as home_team_tla,
        ht.crest as home_team_crest,
        ht.address as home_team_address,
        ht.website as home_team_website,
        ht.founded as home_team_founded,
        ht.club_colors as home_team_colors,
        ht.venue as home_team_venue,
        ht.area_name as home_team_area,
        
        at.short_name as away_team_short_name,
        at.tla as away_team_tla,
        at.crest as away_team_crest,
        at.address as away_team_address,
        at.website as away_team_website,
        at.founded as away_team_founded,
        at.club_colors as away_team_colors,
        at.venue as away_team_venue,
        at.area_name as away_team_area,
        
        c.id as competition_id,
        c.name as competition_name,
        c.code as competition_code,
        c.emblem as competition_emblem,
        c.type as competition_type,
        c.area_name as competition_area_name,
        c.area_code as competition_area_code
        
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN competitions c ON m.competition_id = c.id
      WHERE m.id = $1
    `;
    
    const matchResult = await pool.query(matchQuery, [id]);
    
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Spiel nicht gefunden' });
    }
    
    const row = matchResult.rows[0];
    
    const match = {
      id: row.id,
      utcDate: row.utc_date,
      status: row.status,
      matchday: row.matchday,
      stage: row.stage,
      group: row.group_name,
      winner: row.winner,
      duration: row.duration,
      venue: row.venue,
      lastUpdated: row.last_updated,
      
      homeTeam: {
        id: row.home_team_id,
        name: row.home_team_name,
        shortName: row.home_team_short_name,
        tla: row.home_team_tla,
        crest: row.home_team_crest,
        address: row.home_team_address,
        website: row.home_team_website,
        founded: row.home_team_founded,
        clubColors: row.home_team_colors,
        venue: row.home_team_venue
      },
      
      awayTeam: {
        id: row.away_team_id,
        name: row.away_team_name,
        shortName: row.away_team_short_name,
        tla: row.away_team_tla,
        crest: row.away_team_crest,
        address: row.away_team_address,
        website: row.away_team_website,
        founded: row.away_team_founded,
        clubColors: row.away_team_colors,
        venue: row.away_team_venue
      },
      
      competition: {
        id: row.competition_id,
        name: row.competition_name,
        code: row.competition_code,
        emblem: row.competition_emblem,
        type: row.competition_type
      },
      
      season: {
        startDate: row.season_start_date
      },
      
      area: {
        name: row.competition_area_name,
        code: row.competition_area_code
      },
      
      referee: row.referee_name ? {
        name: row.referee_name,
        nationality: row.referee_nationality
      } : null,
      
      score: {
        fullTime: {
          home: row.full_time_home,
          away: row.full_time_away
        },
        halfTime: {
          home: row.half_time_home,
          away: row.half_time_away
        }
      }
    };
    
    res.json(match);
    
  } catch (error) {
    console.error('Fehler beim Abrufen des Spiels:', error);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen des Spiels',
      details: error.message 
    });
  }
});

// GET /api/matches/meta/competitions - Alle Wettbewerbe
router.get('/meta/competitions', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        id,
        name,
        code,
        emblem,
        type,
        area_name,
        area_code
      FROM competitions
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Wettbewerbe:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Wettbewerbe' });
  }
});

// GET /api/matches/team/:teamId/history - Historische Spiele eines Teams mit Filter
router.get('/team/:teamId/history', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { type, location } = req.query; // type: 'bothScore', 'notBothScore', 'over25', 'under25', 'win', 'draw', 'loss'
    
    let whereClause = '';
    
    if (location === 'home') {
      whereClause = `home_team_id = $1`;
      
      switch(type) {
        case 'bothScore':
          whereClause += ` AND full_time_home > 0 AND full_time_away > 0`;
          break;
        case 'notBothScore':
          whereClause += ` AND (full_time_home = 0 OR full_time_away = 0)`;
          break;
        case 'over25':
          whereClause += ` AND (full_time_home + full_time_away) > 2`;
          break;
        case 'under25':
          whereClause += ` AND (full_time_home + full_time_away) < 3`;
          break;
        case 'win':
          whereClause += ` AND full_time_home > full_time_away`;
          break;
        case 'draw':
          whereClause += ` AND full_time_home = full_time_away`;
          break;
        case 'loss':
          whereClause += ` AND full_time_home < full_time_away`;
          break;
      }
    } else if (location === 'away') {
      whereClause = `away_team_id = $1`;
      
      switch(type) {
        case 'bothScore':
          whereClause += ` AND full_time_home > 0 AND full_time_away > 0`;
          break;
        case 'notBothScore':
          whereClause += ` AND (full_time_home = 0 OR full_time_away = 0)`;
          break;
        case 'over25':
          whereClause += ` AND (full_time_home + full_time_away) > 2`;
          break;
        case 'under25':
          whereClause += ` AND (full_time_home + full_time_away) < 3`;
          break;
        case 'win':
          whereClause += ` AND full_time_away > full_time_home`;
          break;
        case 'draw':
          whereClause += ` AND full_time_away = full_time_home`;
          break;
        case 'loss':
          whereClause += ` AND full_time_away < full_time_home`;
          break;
      }
    }
    
    const query = `
      SELECT 
        m.id,
        m.utc_date,
        m.matchday,
        m.home_team_name,
        m.away_team_name,
        m.full_time_home,
        m.full_time_away,
        m.venue,
        c.name as competition_name,
        c.emblem as competition_emblem
      FROM matches m
      LEFT JOIN competitions c ON m.competition_id = c.id
      WHERE ${whereClause}
        AND status = 'FINISHED'
        AND full_time_home IS NOT NULL
      ORDER BY m.utc_date DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query, [teamId]);
    
    const matches = result.rows.map(row => ({
      id: row.id,
      utcDate: row.utc_date,
      matchday: row.matchday,
      homeTeam: row.home_team_name,
      awayTeam: row.away_team_name,
      score: {
        home: row.full_time_home,
        away: row.full_time_away
      },
      venue: row.venue,
      competition: {
        name: row.competition_name,
        emblem: row.competition_emblem
      }
    }));
    
    res.json({
      count: matches.length,
      matches
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Team-Historie:', error);
    res.status(500).json({ 
      error: 'Fehler beim Abrufen der Team-Historie',
      details: error.message 
    });
  }
});

module.exports = router;
