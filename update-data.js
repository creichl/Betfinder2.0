require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'football_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  // UTF-8 Encoding für korrekte Sonderzeichen
  client_encoding: 'UTF8'
});

// Rate Limiting
const REQUESTS_PER_MINUTE = 500;
const DELAY_BETWEEN_REQUESTS = Math.ceil(60000 / REQUESTS_PER_MINUTE);

let stats = {
  totalRequests: 0,
  competitions: 0,
  matches: { updated: 0, new: 0, unchanged: 0 },
  teams: 0,
  scorers: 0,
  standings: 0
};

let requestCount = 0;
let startMinute = Date.now();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function apiRequest(endpoint, retryCount = 0) {
  try {
    requestCount++;
    stats.totalRequests++;
    const elapsed = Date.now() - startMinute;
    
    if (elapsed < 60000 && requestCount >= REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - elapsed + 1000;
      console.log(`⏳ Rate Limit - Warte ${Math.round(waitTime/1000)}s...`);
      await sleep(waitTime);
      requestCount = 0;
      startMinute = Date.now();
    }
    
    if (elapsed >= 60000) {
      requestCount = 1;
      startMinute = Date.now();
    }

    await sleep(DELAY_BETWEEN_REQUESTS);

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { 'X-Auth-Token': API_KEY },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 429 && retryCount < 5) {
      const waitTime = (retryCount + 1) * 10000;
      console.log(`⏳ Rate Limit! Warte ${waitTime/1000}s...`);
      await sleep(waitTime);
      return apiRequest(endpoint, retryCount + 1);
    }
    
    if (error.response?.status === 403) {
      return null;
    }
    
    if (retryCount < 3) {
      await sleep(5000);
      return apiRequest(endpoint, retryCount + 1);
    }
    
    throw error;
  }
}

// ===== UPDATE STRATEGIEN =====

/**
 * Strategie 1: Update nur aktuelle Matches (letzten 7 Tage + nächsten 14 Tage)
 * Perfekt für tägliche Updates
 */
async function updateRecentMatches(daysBack = 7, daysForward = 14) {
  console.log('\n📅 UPDATE: Aktuelle Matches');
  console.log(`   Zeitraum: ${daysBack} Tage zurück bis ${daysForward} Tage voraus`);
  console.log('='.repeat(70));

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);
  const dateTo = new Date();
  dateTo.setDate(dateTo.getDate() + daysForward);

  const dateFromStr = dateFrom.toISOString().split('T')[0];
  const dateToStr = dateTo.toISOString().split('T')[0];

  console.log(`   Von: ${dateFromStr}`);
  console.log(`   Bis: ${dateToStr}\n`);

  // Hole alle Competitions
  const compsResult = await pool.query('SELECT id, name FROM competitions ORDER BY id');
  
  for (const comp of compsResult.rows) {
    console.log(`\n🏆 ${comp.name} (ID: ${comp.id})`);
    
    try {
      // API erlaubt dateFrom/dateTo Filter für Matches
      const matchesData = await apiRequest(
        `/competitions/${comp.id}/matches?dateFrom=${dateFromStr}&dateTo=${dateToStr}`
      );
      
      if (!matchesData || !matchesData.matches) {
        console.log('   ⚠️  Keine Daten verfügbar');
        continue;
      }

      console.log(`   📊 ${matchesData.matches.length} Matches gefunden`);

      for (const match of matchesData.matches) {
        await updateMatch(match, comp.id);
      }

      console.log(`   ✅ Update komplett`);

    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
    }

    await sleep(500);
  }
}

/**
 * Strategie 2: Update nur laufende/geplante Matches
 * Perfekt für Live-Updates
 */
async function updateLiveMatches() {
  console.log('\n🔴 UPDATE: Live & Geplante Matches');
  console.log('='.repeat(70));

  // Finde alle Matches die nicht FINISHED sind
  const result = await pool.query(`
    SELECT DISTINCT competition_id, id as match_id, home_team_name, away_team_name, status
    FROM matches 
    WHERE status NOT IN ('FINISHED', 'CANCELLED', 'POSTPONED', 'AWARDED')
    AND utc_date > (CURRENT_DATE - INTERVAL '2 days')
    ORDER BY competition_id, utc_date
  `);

  console.log(`\n📊 Gefunden: ${result.rows.length} aktive Matches\n`);

  for (const row of result.rows) {
    console.log(`⚽ ${row.home_team_name} vs ${row.away_team_name} (${row.status})`);
    
    try {
      // Hole Match-Details von API
      const matchData = await apiRequest(`/matches/${row.match_id}`);
      
      if (matchData) {
        await updateMatch(matchData, row.competition_id);
        console.log(`   ✅ Updated auf Status: ${matchData.status}`);
      }

    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
    }

    await sleep(300);
  }
}

/**
 * Strategie 3: Update nur aktuelle Season
 * Perfekt für wöchentliche Updates
 */
async function updateCurrentSeason() {
  console.log('\n📅 UPDATE: Aktuelle Season (alle Competitions)');
  console.log('='.repeat(70));

  const compsResult = await pool.query(`
    SELECT id, name, current_season_start_date 
    FROM competitions 
    WHERE current_season_start_date IS NOT NULL
    ORDER BY id
  `);

  for (const comp of compsResult.rows) {
    console.log(`\n🏆 ${comp.name}`);
    
    try {
      const season = comp.current_season_start_date.getFullYear();
      
      // 1. Update Matches
      console.log(`   ⚽ Lade Matches (Season ${season})...`);
      const matchesData = await apiRequest(`/competitions/${comp.id}/matches?season=${season}`);
      
      if (matchesData?.matches) {
        console.log(`   📊 ${matchesData.matches.length} Matches`);
        for (const match of matchesData.matches) {
          await updateMatch(match, comp.id);
        }
      }

      // 2. Update Standings
      console.log(`   📊 Lade Standings...`);
      const standingsData = await apiRequest(`/competitions/${comp.id}/standings?season=${season}`);
      
      if (standingsData?.standings) {
        await updateStandings(standingsData.standings, comp.id, comp.current_season_start_date);
        stats.standings++;
      }

      // 3. Update Top Scorers
      console.log(`   🥇 Lade Top Scorers...`);
      const scorersData = await apiRequest(`/competitions/${comp.id}/scorers?season=${season}`);
      
      if (scorersData?.scorers) {
        await updateScorers(scorersData.scorers, comp.id, comp.current_season_start_date);
        stats.scorers++;
      }

      console.log(`   ✅ ${comp.name} updated`);

    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
    }

    await sleep(1000);
  }
}

/**
 * Strategie 4: Smart Update - Nur was sich geändert hat
 * Nutzt last_updated Timestamps
 */
async function smartUpdate(hoursBack = 24) {
  console.log('\n🧠 SMART UPDATE: Nur geänderte Daten');
  console.log(`   Zeitraum: Letzte ${hoursBack} Stunden`);
  console.log('='.repeat(70));

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

  // Finde Matches die kürzlich updated wurden ODER nicht FINISHED sind
  const result = await pool.query(`
    SELECT DISTINCT competition_id, id as match_id, home_team_name, away_team_name
    FROM matches 
    WHERE (
      last_updated < $1 AND status NOT IN ('FINISHED', 'CANCELLED', 'POSTPONED')
    ) OR (
      status IN ('IN_PLAY', 'PAUSED', 'LIVE')
    )
    ORDER BY utc_date DESC
    LIMIT 100
  `, [cutoffDate]);

  console.log(`\n📊 Gefunden: ${result.rows.length} Matches die ein Update brauchen\n`);

  for (const row of result.rows) {
    console.log(`⚽ ${row.home_team_name} vs ${row.away_team_name}`);
    
    try {
      const matchData = await apiRequest(`/matches/${row.match_id}`);
      
      if (matchData) {
        await updateMatch(matchData, row.competition_id);
      }

    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
    }

    await sleep(300);
  }
}

// ===== HELPER FUNKTIONEN =====

async function updateMatch(match, competitionId) {
  if (!match || !match.id) return;
  
  try {
    // Prüfe ob Match existiert
    const existing = await pool.query('SELECT status, full_time_home, full_time_away FROM matches WHERE id = $1', [match.id]);
    
    const isNew = existing.rows.length === 0;
    const hasChanged = existing.rows.length > 0 && (
      existing.rows[0].status !== match.status ||
      existing.rows[0].full_time_home !== match.score?.fullTime?.home ||
      existing.rows[0].full_time_away !== match.score?.fullTime?.away
    );

    if (isNew) {
      // Teams sicherstellen
      if (match.homeTeam) await updateTeam(match.homeTeam);
      if (match.awayTeam) await updateTeam(match.awayTeam);

      // Neues Match einfügen
      await pool.query(`
        INSERT INTO matches (
          id, competition_id, season_start_date, utc_date, status, matchday,
          stage, group_name, home_team_id, away_team_id, home_team_name,
          away_team_name, winner, duration, full_time_home, full_time_away,
          half_time_home, half_time_away, referee_name, referee_nationality, venue
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        match.id, competitionId, match.season?.startDate, match.utcDate, match.status,
        match.matchday, match.stage, match.group, match.homeTeam?.id, match.awayTeam?.id,
        match.homeTeam?.name, match.awayTeam?.name, match.score?.winner, match.score?.duration,
        match.score?.fullTime?.home, match.score?.fullTime?.away,
        match.score?.halfTime?.home, match.score?.halfTime?.away,
        match.referees?.[0]?.name, match.referees?.[0]?.nationality, match.venue
      ]);
      
      stats.matches.new++;
      
    } else if (hasChanged) {
      // Match updaten
      await pool.query(`
        UPDATE matches SET
          status = $1,
          full_time_home = $2,
          full_time_away = $3,
          half_time_home = $4,
          half_time_away = $5,
          winner = $6,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [
        match.status,
        match.score?.fullTime?.home,
        match.score?.fullTime?.away,
        match.score?.halfTime?.home,
        match.score?.halfTime?.away,
        match.score?.winner,
        match.id
      ]);
      
      stats.matches.updated++;
      
    } else {
      stats.matches.unchanged++;
    }

  } catch (error) {
    console.error(`      ❌ Match ${match.id}: ${error.message}`);
  }
}

async function updateTeam(team) {
  if (!team || !team.id) return;
  
  try {
    await pool.query(`
      INSERT INTO teams (
        id, name, short_name, tla, crest, address, website,
        founded, club_colors, venue, area_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        crest = EXCLUDED.crest,
        last_updated = CURRENT_TIMESTAMP
    `, [
      team.id, team.name, team.shortName, team.tla, team.crest,
      team.address, team.website, team.founded, team.clubColors,
      team.venue, team.area?.name
    ]);
    
    stats.teams++;
  } catch (error) {
    // Ignoriere Fehler
  }
}

async function updateStandings(standings, competitionId, seasonStartDate) {
  for (const standingGroup of standings) {
    if (standingGroup.table) {
      for (const standing of standingGroup.table) {
        try {
          await pool.query(`
            INSERT INTO standings (
              competition_id, season_start_date, stage, type, group_name,
              position, team_id, team_name, played_games, won, draw, lost,
              points, goals_for, goals_against, goal_difference, form
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (competition_id, season_start_date, stage, type, team_id) DO UPDATE SET
              position = EXCLUDED.position,
              played_games = EXCLUDED.played_games,
              won = EXCLUDED.won,
              draw = EXCLUDED.draw,
              lost = EXCLUDED.lost,
              points = EXCLUDED.points,
              goals_for = EXCLUDED.goals_for,
              goals_against = EXCLUDED.goals_against,
              goal_difference = EXCLUDED.goal_difference,
              form = EXCLUDED.form
          `, [
            competitionId, seasonStartDate, standingGroup.stage, standingGroup.type,
            standingGroup.group, standing.position, standing.team.id, standing.team.name,
            standing.playedGames, standing.won, standing.draw, standing.lost,
            standing.points, standing.goalsFor, standing.goalsAgainst,
            standing.goalDifference, standing.form
          ]);
        } catch (error) {
          // Ignoriere Fehler
        }
      }
    }
  }
}

async function updateScorers(scorers, competitionId, seasonStartDate) {
  for (const scorer of scorers) {
    try {
      await pool.query(`
        INSERT INTO top_scorers (
          competition_id, season_start_date, player_id, player_name,
          team_id, team_name, goals, assists, penalties, played_matches
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (competition_id, season_start_date, player_id) DO UPDATE SET
          goals = EXCLUDED.goals,
          assists = EXCLUDED.assists,
          penalties = EXCLUDED.penalties,
          played_matches = EXCLUDED.played_matches
      `, [
        competitionId, seasonStartDate, scorer.player.id, scorer.player.name,
        scorer.team?.id, scorer.team?.name, scorer.goals, scorer.assists,
        scorer.penalties, scorer.playedMatches
      ]);
    } catch (error) {
      // Ignoriere Fehler
    }
  }
}

function showStats() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 UPDATE STATISTIKEN');
  console.log('='.repeat(70));
  console.log(`📡 API Requests: ${stats.totalRequests}`);
  console.log(`🏆 Competitions: ${stats.competitions}`);
  console.log(`⚽ Matches: ${stats.matches.new} neu, ${stats.matches.updated} updated, ${stats.matches.unchanged} unverändert`);
  console.log(`🏟️  Teams: ${stats.teams}`);
  console.log(`📊 Standings: ${stats.standings}`);
  console.log(`🥇 Top Scorers: ${stats.scorers}`);
  console.log('='.repeat(70) + '\n');
}

// ===== MAIN =====

async function main() {
  const startTime = Date.now();
  console.log('\n🔄 STARTE DATEN-UPDATE');
  console.log(`⏰ Start: ${new Date().toLocaleString('de-DE')}\n`);

  // Kommandozeilen-Argument für Update-Modus
  const mode = process.argv[2] || 'recent';

  try {
    switch(mode) {
      case 'live':
        console.log('🔴 Modus: Live Matches');
        await updateLiveMatches();
        break;
        
      case 'recent':
        console.log('📅 Modus: Aktuelle Matches (Standard)');
        await updateRecentMatches(7, 14); // 7 Tage zurück, 14 voraus
        break;
        
      case 'today':
        console.log('📅 Modus: Nur Heute');
        await updateRecentMatches(0, 1); // Nur heute
        break;
        
      case 'week':
        console.log('📅 Modus: Diese Woche');
        await updateRecentMatches(3, 7);
        break;
        
      case 'season':
        console.log('📅 Modus: Aktuelle Season');
        await updateCurrentSeason();
        break;
        
      case 'smart':
        console.log('🧠 Modus: Smart Update');
        await smartUpdate(24); // Letzte 24 Stunden
        break;
        
      default:
        console.log('❌ Unbekannter Modus!');
        console.log('\nVerfügbare Modi:');
        console.log('  node update-data.js live      - Nur laufende/geplante Matches');
        console.log('  node update-data.js recent    - Letzte 7 + nächste 14 Tage (Standard)');
        console.log('  node update-data.js today     - Nur heute');
        console.log('  node update-data.js week      - Diese Woche');
        console.log('  node update-data.js season    - Komplette aktuelle Season');
        console.log('  node update-data.js smart     - Intelligentes Update (letzte 24h)\n');
        process.exit(1);
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ UPDATE ABGESCHLOSSEN in ${durationSec} Sekunden`);
    console.log(`⏰ Beendet: ${new Date().toLocaleString('de-DE')}`);
    
    showStats();

  } catch (error) {
    console.error('\n❌ Kritischer Fehler:', error);
    showStats();
  } finally {
    await pool.end();
  }
}

// Validierung
if (!API_KEY) {
  console.error('❌ FEHLER: FOOTBALL_API_KEY nicht in .env gefunden!');
  process.exit(1);
}

// Start
main().catch(error => {
  console.error('❌ Unerwarteter Fehler:', error);
  process.exit(1);
});
