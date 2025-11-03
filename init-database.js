// init-database.js
const pool = require('./database');

async function initDatabase() {
  try {
    console.log('📊 Erstelle Datenbank-Schema für football-data.org API...\n');

    // ==========================================
    // 1. AREAS (Länder/Kontinente)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10),
        flag VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "areas" erstellt');

    // ==========================================
    // 2. COMPETITIONS (Ligen/Wettbewerbe)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS competitions (
        id INTEGER PRIMARY KEY,
        area_id INTEGER REFERENCES areas(id),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10),
        type VARCHAR(20),
        emblem VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "competitions" erstellt');

    // ==========================================
    // 3. SEASONS
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id INTEGER PRIMARY KEY,
        competition_id INTEGER REFERENCES competitions(id),
        start_date DATE,
        end_date DATE,
        current_matchday INTEGER,
        winner_team_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "seasons" erstellt');

    // ==========================================
    // 4. TEAMS
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY,
        area_id INTEGER REFERENCES areas(id),
        name VARCHAR(100) NOT NULL,
        short_name VARCHAR(50),
        tla VARCHAR(10),
        crest VARCHAR(255),
        address TEXT,
        website VARCHAR(255),
        founded INTEGER,
        club_colors VARCHAR(50),
        venue VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "teams" erstellt');

    // ==========================================
    // 5. PERSONS (Spieler, Trainer, Schiedsrichter)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        date_of_birth DATE,
        nationality VARCHAR(50),
        position VARCHAR(50),
        shirt_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "persons" erstellt');

    // ==========================================
    // 6. MATCHES (Spiele)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY,
        area_id INTEGER REFERENCES areas(id),
        competition_id INTEGER REFERENCES competitions(id),
        season_id INTEGER REFERENCES seasons(id),
        utc_date TIMESTAMP NOT NULL,
        status VARCHAR(20),
        matchday INTEGER,
        stage VARCHAR(50),
        group_name VARCHAR(50),
        last_updated TIMESTAMP,
        
        home_team_id INTEGER REFERENCES teams(id),
        away_team_id INTEGER REFERENCES teams(id),
        
        -- Score Information
        winner VARCHAR(10),
        duration VARCHAR(20),
        full_time_home INTEGER,
        full_time_away INTEGER,
        half_time_home INTEGER,
        half_time_away INTEGER,
        regular_time_home INTEGER,
        regular_time_away INTEGER,
        extra_time_home INTEGER,
        extra_time_away INTEGER,
        penalties_home INTEGER,
        penalties_away INTEGER,
        
        -- Additional Info
        venue VARCHAR(100),
        attendance INTEGER,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "matches" erstellt');

    // ==========================================
    // 7. MATCH_REFEREES (Schiedsrichter pro Spiel)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_referees (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        person_id INTEGER REFERENCES persons(id),
        referee_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "match_referees" erstellt');

    // ==========================================
    // 8. TEAM_COMPETITIONS (Welches Team in welchem Wettbewerb)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_competitions (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
        season_id INTEGER REFERENCES seasons(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, competition_id, season_id)
      );
    `);
    console.log('✅ Tabelle "team_competitions" erstellt');

    // ==========================================
    // 9. STANDINGS (Tabellenstände)
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS standings (
        id SERIAL PRIMARY KEY,
        competition_id INTEGER REFERENCES competitions(id),
        season_id INTEGER REFERENCES seasons(id),
        team_id INTEGER REFERENCES teams(id),
        position INTEGER,
        played_games INTEGER,
        won INTEGER,
        draw INTEGER,
        lost INTEGER,
        points INTEGER,
        goals_for INTEGER,
        goals_against INTEGER,
        goal_difference INTEGER,
        stage VARCHAR(50),
        group_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(competition_id, season_id, team_id, stage)
      );
    `);
    console.log('✅ Tabelle "standings" erstellt');

    // ==========================================
    // INDIZES für bessere Performance
    // ==========================================
    console.log('\n📈 Erstelle Indizes für schnellere Abfragen...');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(utc_date);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_standings_competition ON standings(competition_id);`);
    
    console.log('✅ Indizes erstellt');

    console.log('\n🎉 Datenbank-Schema erfolgreich erstellt!');
    console.log('\n📋 Übersicht der Tabellen:');
    console.log('   - areas (Länder/Regionen)');
    console.log('   - competitions (Ligen/Wettbewerbe)');
    console.log('   - seasons (Saisons)');
    console.log('   - teams (Mannschaften)');
    console.log('   - persons (Spieler/Trainer/Schiedsrichter)');
    console.log('   - matches (Spiele mit allen Details)');
    console.log('   - match_referees (Schiedsrichter-Zuordnung)');
    console.log('   - team_competitions (Team-Wettbewerb-Zuordnung)');
    console.log('   - standings (Tabellenstände)');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fehler beim Initialisieren:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initDatabase();
