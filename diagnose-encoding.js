// diagnose-encoding.js
// Findet alle falsch codierten Umlaute in der Datenbank

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'betfinder',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  client_encoding: 'UTF8'
});

async function diagnoseEncoding() {
  try {
    console.log('🔍 Suche nach Encoding-Problemen...\n');
    
    // Problematische Zeichen-Muster
    const patterns = [
      '├ä', '├Ą', '├ť', '├ľ', '├╝',  // ä, á, ü, ö, ü
      '├ľ', '├ś', '├ť', '├ë', '├ę',  // ö, Ö, ü, ë, é
      '├Ą', '├ę', '├¬', '├â', '├í'   // á, é, ¬, â, í
    ];
    
    // 1. Prüfe Teams-Tabelle
    console.log('📊 Teams mit Encoding-Problemen:');
    console.log('=' .repeat(80));
    
    const teamsQuery = `
      SELECT id, name, short_name, venue, address
      FROM teams
      WHERE name LIKE '%├%'
         OR short_name LIKE '%├%'
         OR venue LIKE '%├%'
         OR address LIKE '%├%'
      ORDER BY name
    `;
    
    const teams = await pool.query(teamsQuery);
    
    if (teams.rows.length > 0) {
      teams.rows.forEach(team => {
        console.log(`\nTeam ID: ${team.id}`);
        console.log(`  Name: ${team.name}`);
        if (team.short_name) console.log(`  Kurzname: ${team.short_name}`);
        if (team.venue) console.log(`  Stadion: ${team.venue}`);
        if (team.address) console.log(`  Adresse: ${team.address}`);
      });
      console.log(`\n✅ ${teams.rows.length} Teams mit Encoding-Problemen gefunden\n`);
    } else {
      console.log('✅ Keine Probleme in Teams gefunden\n');
    }
    
    // 2. Prüfe Matches-Tabelle
    console.log('⚽ Matches mit Encoding-Problemen:');
    console.log('=' .repeat(80));
    
    const matchesQuery = `
      SELECT id, home_team_name, away_team_name, venue
      FROM matches
      WHERE home_team_name LIKE '%├%'
         OR away_team_name LIKE '%├%'
         OR venue LIKE '%├%'
      ORDER BY utc_date DESC
      LIMIT 20
    `;
    
    const matches = await pool.query(matchesQuery);
    
    if (matches.rows.length > 0) {
      matches.rows.forEach(match => {
        console.log(`\nMatch ID: ${match.id}`);
        console.log(`  Heim: ${match.home_team_name}`);
        console.log(`  Auswärts: ${match.away_team_name}`);
        if (match.venue) console.log(`  Venue: ${match.venue}`);
      });
      console.log(`\n✅ ${matches.rows.length} Matches mit Encoding-Problemen gefunden (max. 20 angezeigt)\n`);
    } else {
      console.log('✅ Keine Probleme in Matches gefunden\n');
    }
    
    // 3. Prüfe Competitions-Tabelle
    console.log('🏆 Competitions mit Encoding-Problemen:');
    console.log('=' .repeat(80));
    
    const compsQuery = `
      SELECT id, name, area_name
      FROM competitions
      WHERE name LIKE '%├%'
         OR area_name LIKE '%├%'
      ORDER BY name
    `;
    
    const comps = await pool.query(compsQuery);
    
    if (comps.rows.length > 0) {
      comps.rows.forEach(comp => {
        console.log(`\nCompetition ID: ${comp.id}`);
        console.log(`  Name: ${comp.name}`);
        if (comp.area_name) console.log(`  Area: ${comp.area_name}`);
      });
      console.log(`\n✅ ${comps.rows.length} Competitions mit Encoding-Problemen gefunden\n`);
    } else {
      console.log('✅ Keine Probleme in Competitions gefunden\n');
    }
    
    // Zusammenfassung
    const total = teams.rows.length + matches.rows.length + comps.rows.length;
    console.log('=' .repeat(80));
    console.log(`\n📈 Gesamtergebnis: ${total} Einträge mit Encoding-Problemen gefunden\n`);
    
    if (total > 0) {
      console.log('💡 Führe fix-encoding-data.js aus, um die Probleme zu beheben.\n');
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await pool.end();
  }
}

// Script ausführen
diagnoseEncoding();
