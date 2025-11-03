require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');
const fs = require('fs').promises;

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

// TIER_FOUR Rate Limits: 500 requests/minute
const REQUESTS_PER_MINUTE = 500;
const DELAY_BETWEEN_REQUESTS = Math.ceil(60000 / REQUESTS_PER_MINUTE); // ~120ms

// Statistiken
let stats = {
  totalRequests: 0,
  competitions: { success: 0, skipped: 0, error: 0 },
  seasons: { success: 0, skipped: 0, error: 0 },
  teams: { success: 0, skipped: 0, error: 0 },
  matches: { success: 0, skipped: 0, error: 0 },
  players: { success: 0, skipped: 0, error: 0 },
  scorers: { success: 0, skipped: 0, error: 0 }
};

// Rate Limiting Management
let requestCount = 0;
let startMinute = Date.now();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function apiRequest(endpoint, retryCount = 0) {
  try {
    // Rate Limiting Management für TIER_FOUR
    requestCount++;
    stats.totalRequests++;
    const elapsed = Date.now() - startMinute;
    
    if (elapsed < 60000 && requestCount >= REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - elapsed + 1000;
      console.log(`⏳ Rate Limit erreicht. Warte ${Math.round(waitTime/1000)}s...`);
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
      console.log(`⏳ Rate Limit! Warte ${waitTime/1000}s... (Versuch ${retryCount + 1}/5)`);
      await sleep(waitTime);
      return apiRequest(endpoint, retryCount + 1);
    }
    
    if (error.response?.status === 403) {
      console.log(`⚠️  Kein Zugriff auf: ${endpoint}`);
      return null;
    }
    
    if (retryCount < 3) {
      console.log(`⚠️  Fehler bei ${endpoint}, wiederhole... (${retryCount + 1}/3)`);
      await sleep(5000);
      return apiRequest(endpoint, retryCount + 1);
    }
    
    throw error;
  }
}

// Datenbank Setup
async function setupDatabase() {
  console.log('\n📊 Erstelle Datenbank-Schema...\n');
  
  const schema = `
    -- Competitions Tabelle
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(10),
      type VARCHAR(50),
      emblem TEXT,
      area_name VARCHAR(255),
      area_code VARCHAR(10),
      current_season_start_date DATE,
      current_season_end_date DATE,
      number_of_available_seasons INTEGER,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Seasons Tabelle
    CREATE TABLE IF NOT EXISTS seasons (
      id SERIAL PRIMARY KEY,
      competition_id INTEGER REFERENCES competitions(id),
      start_date DATE,
      end_date DATE,
      current_matchday INTEGER,
      winner_id INTEGER,
      winner_name VARCHAR(255),
      UNIQUE(competition_id, start_date)
    );

    -- Teams Tabelle
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      tla VARCHAR(10),
      crest TEXT,
      address VARCHAR(500),
      website VARCHAR(255),
      founded INTEGER,
      club_colors VARCHAR(100),
      venue VARCHAR(255),
      area_name VARCHAR(255),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Matches Tabelle
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY,
      competition_id INTEGER REFERENCES competitions(id),
      season_start_date DATE,
      utc_date TIMESTAMP,
      status VARCHAR(50),
      matchday INTEGER,
      stage VARCHAR(100),
      group_name VARCHAR(100),
      home_team_id INTEGER REFERENCES teams(id),
      away_team_id INTEGER REFERENCES teams(id),
      home_team_name VARCHAR(255),
      away_team_name VARCHAR(255),
      winner VARCHAR(20),
      duration VARCHAR(20),
      full_time_home INTEGER,
      full_time_away INTEGER,
      half_time_home INTEGER,
      half_time_away INTEGER,
      referee_name VARCHAR(255),
      referee_nationality VARCHAR(100),
      venue VARCHAR(255),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Players Tabelle
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      date_of_birth DATE,
      nationality VARCHAR(100),
      position VARCHAR(50),
      shirt_number INTEGER,
      team_id INTEGER REFERENCES teams(id),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Top Scorers Tabelle
    CREATE TABLE IF NOT EXISTS top_scorers (
      id SERIAL PRIMARY KEY,
      competition_id INTEGER REFERENCES competitions(id),
      season_start_date DATE,
      player_id INTEGER,
      player_name VARCHAR(255),
      team_id INTEGER REFERENCES teams(id),
      team_name VARCHAR(255),
      goals INTEGER,
      assists INTEGER,
      penalties INTEGER,
      played_matches INTEGER,
      UNIQUE(competition_id, season_start_date, player_id)
    );

    -- Standings Tabelle
    CREATE TABLE IF NOT EXISTS standings (
      id SERIAL PRIMARY KEY,
      competition_id INTEGER REFERENCES competitions(id),
      season_start_date DATE,
      stage VARCHAR(100),
      type VARCHAR(50),
      group_name VARCHAR(100),
      position INTEGER,
      team_id INTEGER REFERENCES teams(id),
      team_name VARCHAR(255),
      played_games INTEGER,
      won INTEGER,
      draw INTEGER,
      lost INTEGER,
      points INTEGER,
      goals_for INTEGER,
      goals_against INTEGER,
      goal_difference INTEGER,
      form VARCHAR(50),
      UNIQUE(competition_id, season_start_date, stage, type, team_id)
    );

    -- Indices für bessere Performance
    CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
    CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(utc_date);
    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_seasons_competition ON seasons(competition_id);
    CREATE INDEX IF NOT EXISTS idx_standings_competition ON standings(competition_id);
    CREATE INDEX IF NOT EXISTS idx_scorers_competition ON top_scorers(competition_id);
  `;

  await pool.query(schema);
  console.log('✅ Datenbank-Schema erstellt!\n');
}

// Import Funktionen
async function importCompetition(comp) {
  try {
    await pool.query(`
      INSERT INTO competitions (
        id, name, code, type, emblem, area_name, area_code,
        current_season_start_date, current_season_end_date,
        number_of_available_seasons
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        current_season_start_date = EXCLUDED.current_season_start_date,
        current_season_end_date = EXCLUDED.current_season_end_date,
        last_updated = CURRENT_TIMESTAMP
    `, [
      comp.id,
      comp.name,
      comp.code,
      comp.type,
      comp.emblem,
      comp.area?.name,
      comp.area?.code,
      comp.currentSeason?.startDate,
      comp.currentSeason?.endDate,
      comp.numberOfAvailableSeasons || 0
    ]);
    
    stats.competitions.success++;
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Import von Competition ${comp.name}:`, error.message);
    stats.competitions.error++;
    return false;
  }
}

async function importTeam(team) {
  if (!team || !team.id) return false;
  
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
      team.id,
      team.name,
      team.shortName,
      team.tla,
      team.crest,
      team.address,
      team.website,
      team.founded,
      team.clubColors,
      team.venue,
      team.area?.name
    ]);
    
    stats.teams.success++;
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Import von Team ${team.name}:`, error.message);
    stats.teams.error++;
    return false;
  }
}

async function importMatch(match, competitionId, seasonStartDate) {
  if (!match || !match.id) return false;
  
  try {
    await pool.query(`
      INSERT INTO matches (
        id, competition_id, season_start_date, utc_date, status, matchday,
        stage, group_name, home_team_id, away_team_id, home_team_name,
        away_team_name, winner, duration, full_time_home, full_time_away,
        half_time_home, half_time_away, referee_name, referee_nationality, venue
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        full_time_home = EXCLUDED.full_time_home,
        full_time_away = EXCLUDED.full_time_away,
        winner = EXCLUDED.winner,
        last_updated = CURRENT_TIMESTAMP
    `, [
      match.id,
      competitionId,
      seasonStartDate,
      match.utcDate,
      match.status,
      match.matchday,
      match.stage,
      match.group,
      match.homeTeam?.id,
      match.awayTeam?.id,
      match.homeTeam?.name,
      match.awayTeam?.name,
      match.score?.winner,
      match.score?.duration,
      match.score?.fullTime?.home,
      match.score?.fullTime?.away,
      match.score?.halfTime?.home,
      match.score?.halfTime?.away,
      match.referees?.[0]?.name,
      match.referees?.[0]?.nationality,
      match.venue
    ]);
    
    stats.matches.success++;
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Import von Match ${match.id}:`, error.message);
    stats.matches.error++;
    return false;
  }
}

async function importPlayer(player, teamId) {
  if (!player || !player.id) return false;
  
  try {
    await pool.query(`
      INSERT INTO players (
        id, name, first_name, last_name, date_of_birth,
        nationality, position, shirt_number, team_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        position = EXCLUDED.position,
        shirt_number = EXCLUDED.shirt_number,
        team_id = EXCLUDED.team_id,
        last_updated = CURRENT_TIMESTAMP
    `, [
      player.id,
      player.name,
      player.firstName,
      player.lastName,
      player.dateOfBirth,
      player.nationality,
      player.position,
      player.shirtNumber,
      teamId
    ]);
    
    stats.players.success++;
    return true;
  } catch (error) {
    stats.players.error++;
    return false;
  }
}

async function importStanding(standing, competitionId, seasonStartDate, stage, type, groupName) {
  if (!standing || !standing.team?.id) return false;
  
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
      competitionId,
      seasonStartDate,
      stage,
      type,
      groupName,
      standing.position,
      standing.team.id,
      standing.team.name,
      standing.playedGames,
      standing.won,
      standing.draw,
      standing.lost,
      standing.points,
      standing.goalsFor,
      standing.goalsAgainst,
      standing.goalDifference,
      standing.form
    ]);
    
    return true;
  } catch (error) {
    return false;
  }
}

async function importTopScorer(scorer, competitionId, seasonStartDate) {
  if (!scorer || !scorer.player?.id) return false;
  
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
      competitionId,
      seasonStartDate,
      scorer.player.id,
      scorer.player.name,
      scorer.team?.id,
      scorer.team?.name,
      scorer.goals,
      scorer.assists,
      scorer.penalties,
      scorer.playedMatches
    ]);
    
    stats.scorers.success++;
    return true;
  } catch (error) {
    stats.scorers.error++;
    return false;
  }
}

// Haupt-Import Funktionen
async function importCompetitionData(compId, compName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🏆 ${compName} (ID: ${compId})`);
  console.log('='.repeat(70));

  try {
    // 1. Competition Details
    console.log('\n📋 Lade Competition Details...');
    const compData = await apiRequest(`/competitions/${compId}`);
    if (!compData) {
      console.log('⚠️  Kein Zugriff - übersprungen');
      stats.competitions.skipped++;
      return;
    }

    // 2. Seasons abrufen
    const seasons = compData.seasons || [];
    console.log(`📅 Gefundene Seasons: ${seasons.length}`);

    if (seasons.length === 0) {
      console.log('⚠️  Keine Seasons verfügbar');
      return;
    }

    // Speichere Competition
    await importCompetition(compData);

    // 3. Jede Season durchgehen
    for (const season of seasons) {
      const seasonStr = `${season.startDate} bis ${season.endDate}`;
      console.log(`\n  📅 Season: ${seasonStr}`);

      try {
        // Season speichern
        await pool.query(`
          INSERT INTO seasons (competition_id, start_date, end_date, current_matchday, winner_id, winner_name)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (competition_id, start_date) DO UPDATE SET
            end_date = EXCLUDED.end_date,
            current_matchday = EXCLUDED.current_matchday,
            winner_id = EXCLUDED.winner_id
        `, [
          compId,
          season.startDate,
          season.endDate,
          season.currentMatchday,
          season.winner?.id,
          season.winner?.name
        ]);
        stats.seasons.success++;

        // 3a. Teams für diese Season
        console.log('    🏟️  Lade Teams...');
        const teamsData = await apiRequest(`/competitions/${compId}/teams?season=${season.startDate.split('-')[0]}`);
        if (teamsData?.teams) {
          console.log(`    ✅ ${teamsData.teams.length} Teams gefunden`);
          for (const team of teamsData.teams) {
            await importTeam(team);
            
            // Squad Details für jedes Team
            if (team.id) {
              const teamData = await apiRequest(`/teams/${team.id}`);
              if (teamData?.squad) {
                for (const player of teamData.squad) {
                  await importPlayer(player, team.id);
                }
              }
            }
          }
        }

        // 3b. Matches für diese Season
        console.log('    ⚽ Lade Matches...');
        const matchesData = await apiRequest(`/competitions/${compId}/matches?season=${season.startDate.split('-')[0]}`);
        if (matchesData?.matches) {
          console.log(`    ✅ ${matchesData.matches.length} Matches gefunden`);
          for (const match of matchesData.matches) {
            // Teams aus Match speichern
            if (match.homeTeam) await importTeam(match.homeTeam);
            if (match.awayTeam) await importTeam(match.awayTeam);
            // Match speichern
            await importMatch(match, compId, season.startDate);
          }
        }

        // 3c. Standings für diese Season
        console.log('    📊 Lade Standings...');
        const standingsData = await apiRequest(`/competitions/${compId}/standings?season=${season.startDate.split('-')[0]}`);
        if (standingsData?.standings) {
          for (const standingGroup of standingsData.standings) {
            if (standingGroup.table) {
              for (const standing of standingGroup.table) {
                await importStanding(
                  standing,
                  compId,
                  season.startDate,
                  standingGroup.stage,
                  standingGroup.type,
                  standingGroup.group
                );
              }
            }
          }
          console.log('    ✅ Standings importiert');
        }

        // 3d. Top Scorers für diese Season
        console.log('    🥇 Lade Top Scorers...');
        const scorersData = await apiRequest(`/competitions/${compId}/scorers?season=${season.startDate.split('-')[0]}`);
        if (scorersData?.scorers) {
          console.log(`    ✅ ${scorersData.scorers.length} Top Scorers gefunden`);
          for (const scorer of scorersData.scorers) {
            await importTopScorer(scorer, compId, season.startDate);
          }
        }

        console.log(`    ✅ Season ${seasonStr} komplett importiert!`);

      } catch (error) {
        console.error(`    ❌ Fehler bei Season ${seasonStr}:`, error.message);
        stats.seasons.error++;
      }

      // Kurze Pause zwischen Seasons
      await sleep(500);
    }

    console.log(`\n✅ ${compName} komplett importiert!`);

  } catch (error) {
    console.error(`❌ Fehler bei ${compName}:`, error.message);
    stats.competitions.error++;
  }
}

async function showStats() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 IMPORT STATISTIKEN');
  console.log('='.repeat(70));
  console.log(`📡 API Requests gesamt: ${stats.totalRequests}`);
  console.log(`\n🏆 Competitions: ${stats.competitions.success} erfolgreich, ${stats.competitions.skipped} übersprungen, ${stats.competitions.error} Fehler`);
  console.log(`📅 Seasons: ${stats.seasons.success} erfolgreich, ${stats.seasons.skipped} übersprungen, ${stats.seasons.error} Fehler`);
  console.log(`🏟️  Teams: ${stats.teams.success} erfolgreich, ${stats.teams.error} Fehler`);
  console.log(`⚽ Matches: ${stats.matches.success} erfolgreich, ${stats.matches.error} Fehler`);
  console.log(`👥 Spieler: ${stats.players.success} erfolgreich, ${stats.players.error} Fehler`);
  console.log(`🥇 Top Scorers: ${stats.scorers.success} erfolgreich, ${stats.scorers.error} Fehler`);

  // Datenbank Stats
  const dbStats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM competitions) as competitions,
      (SELECT COUNT(*) FROM seasons) as seasons,
      (SELECT COUNT(*) FROM teams) as teams,
      (SELECT COUNT(*) FROM matches) as matches,
      (SELECT COUNT(*) FROM players) as players,
      (SELECT COUNT(*) FROM top_scorers) as scorers,
      (SELECT COUNT(*) FROM standings) as standings
  `);
  
  console.log('\n💾 DATENBANK INHALT:');
  console.log('='.repeat(70));
  console.log(`🏆 Competitions: ${dbStats.rows[0].competitions}`);
  console.log(`📅 Seasons: ${dbStats.rows[0].seasons}`);
  console.log(`🏟️  Teams: ${dbStats.rows[0].teams}`);
  console.log(`⚽ Matches: ${dbStats.rows[0].matches}`);
  console.log(`👥 Spieler: ${dbStats.rows[0].players}`);
  console.log(`🥇 Top Scorers: ${dbStats.rows[0].scorers}`);
  console.log(`📊 Standings: ${dbStats.rows[0].standings}`);
  console.log('='.repeat(70) + '\n');
}

// Hauptfunktion
async function main() {
  const startTime = Date.now();
  console.log('\n🚀 STARTE KOMPLETTEN IMPORT - ALLE DATEN VON ALLEN COMPETITIONS\n');
  console.log(`⏰ Start: ${new Date().toLocaleString('de-DE')}`);

  try {
    // 1. Datenbank Setup
    await setupDatabase();

    // 2. Alle Competitions abrufen
    console.log('📥 Lade alle verfügbaren Competitions...\n');
    const competitionsData = await apiRequest('/competitions');
    
    if (!competitionsData || !competitionsData.competitions) {
      throw new Error('Keine Competitions gefunden!');
    }

    const competitions = competitionsData.competitions;
    console.log(`✅ ${competitions.length} Competitions gefunden!\n`);

    // 3. Jede Competition komplett importieren
    for (let i = 0; i < competitions.length; i++) {
      const comp = competitions[i];
      console.log(`\n[${i + 1}/${competitions.length}] Importiere ${comp.name}...`);
      await importCompetitionData(comp.id, comp.name);
      
      // Pause zwischen Competitions
      await sleep(1000);
    }

    // 4. Finale Statistiken
    const totalMinutes = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log('\n' + '='.repeat(70));
    console.log('🎉🎉🎉 IMPORT ABGESCHLOSSEN 🎉🎉🎉');
    console.log('='.repeat(70));
    console.log(`⏰ Gesamtdauer: ${totalMinutes} Minuten`);
    console.log(`⏰ Beendet: ${new Date().toLocaleString('de-DE')}`);
    
    await showStats();
    
    console.log('\n🏆 Du hast jetzt eine umfassende Fußball-Datenbank! 🏆\n');

  } catch (error) {
    console.error('❌ Kritischer Fehler:', error);
    await showStats();
  } finally {
    await pool.end();
  }
}

// Validierung und Start
if (!API_KEY) {
  console.error('❌ FEHLER: FOOTBALL_API_KEY nicht in .env gefunden!');
  console.log('\nBitte erstelle eine .env Datei mit:');
  console.log('FOOTBALL_API_KEY=dein_api_key');
  console.log('DB_USER=postgres');
  console.log('DB_PASSWORD=dein_passwort');
  console.log('DB_NAME=football_db');
  console.log('DB_HOST=localhost');
  console.log('DB_PORT=5432');
  process.exit(1);
}

// Starte Import
main().catch(error => {
  console.error('❌ Unerwarteter Fehler:', error);
  process.exit(1);
});