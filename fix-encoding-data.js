// fix-encoding-data.js
// Korrigiert falsch codierte Umlaute in der Datenbank

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

// Mapping der falsch codierten Zeichen zu den korrekten Umlauten
const encodingMap = {
  '├ñ': 'ä',
  '├Ą': 'Ä',
  '├ľ': 'ö',
  '├ľ': 'ö', // Duplikat, aber sicher ist sicher
  '├ś': 'Ö',
  '├╝': 'ü',
  '├ť': 'Ü',
  '├č': 'ß',
  '├®': 'é',
  '├¿': 'è',
  '├¬': 'í',
  '├│': 'ó',
  '├║': 'ú',
  '├ę': 'á',
  '├â': 'â',
  '├¬': 'ì',
  '├¨': 'à',
  '├ë': 'ë',
  '├«': 'ê'
};

function fixEncoding(text) {
  if (!text) return text;
  
  let fixed = text;
  for (const [wrong, correct] of Object.entries(encodingMap)) {
    fixed = fixed.replace(new RegExp(wrong, 'g'), correct);
  }
  
  return fixed;
}

async function fixEncodingInDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starte Encoding-Korrektur...\n');
    
    await client.query('BEGIN');
    
    let totalFixed = 0;
    
    // 1. Korrigiere Teams-Tabelle
    console.log('📊 Korrigiere Teams...');
    console.log('=' .repeat(80));
    
    const teamsQuery = `
      SELECT id, name, short_name, venue, address
      FROM teams
      WHERE name LIKE '%├%'
         OR short_name LIKE '%├%'
         OR venue LIKE '%├%'
         OR address LIKE '%├%'
    `;
    
    const teams = await client.query(teamsQuery);
    
    for (const team of teams.rows) {
      const newName = fixEncoding(team.name);
      const newShortName = fixEncoding(team.short_name);
      const newVenue = fixEncoding(team.venue);
      const newAddress = fixEncoding(team.address);
      
      console.log(`\nTeam ID ${team.id}:`);
      if (newName !== team.name) {
        console.log(`  Name: "${team.name}" → "${newName}"`);
      }
      if (newShortName !== team.short_name) {
        console.log(`  Kurzname: "${team.short_name}" → "${newShortName}"`);
      }
      if (newVenue !== team.venue) {
        console.log(`  Stadion: "${team.venue}" → "${newVenue}"`);
      }
      if (newAddress !== team.address) {
        console.log(`  Adresse: "${team.address}" → "${newAddress}"`);
      }
      
      await client.query(
        `UPDATE teams 
         SET name = $1, short_name = $2, venue = $3, address = $4
         WHERE id = $5`,
        [newName, newShortName, newVenue, newAddress, team.id]
      );
      
      totalFixed++;
    }
    
    console.log(`\n✅ ${teams.rows.length} Teams korrigiert\n`);
    
    // 2. Korrigiere Matches-Tabelle
    console.log('⚽ Korrigiere Matches...');
    console.log('=' .repeat(80));
    
    const matchesQuery = `
      SELECT id, home_team_name, away_team_name, venue, referee_name
      FROM matches
      WHERE home_team_name LIKE '%├%'
         OR away_team_name LIKE '%├%'
         OR venue LIKE '%├%'
         OR referee_name LIKE '%├%'
    `;
    
    const matches = await client.query(matchesQuery);
    
    let matchCount = 0;
    for (const match of matches.rows) {
      const newHomeName = fixEncoding(match.home_team_name);
      const newAwayName = fixEncoding(match.away_team_name);
      const newVenue = fixEncoding(match.venue);
      const newRefereeName = fixEncoding(match.referee_name);
      
      if (matchCount < 10) { // Zeige nur erste 10 an
        console.log(`\nMatch ID ${match.id}:`);
        if (newHomeName !== match.home_team_name) {
          console.log(`  Heim: "${match.home_team_name}" → "${newHomeName}"`);
        }
        if (newAwayName !== match.away_team_name) {
          console.log(`  Auswärts: "${match.away_team_name}" → "${newAwayName}"`);
        }
        if (newVenue !== match.venue) {
          console.log(`  Venue: "${match.venue}" → "${newVenue}"`);
        }
        if (newRefereeName !== match.referee_name) {
          console.log(`  Referee: "${match.referee_name}" → "${newRefereeName}"`);
        }
      }
      
      await client.query(
        `UPDATE matches 
         SET home_team_name = $1, away_team_name = $2, venue = $3, referee_name = $4
         WHERE id = $5`,
        [newHomeName, newAwayName, newVenue, newRefereeName, match.id]
      );
      
      matchCount++;
      totalFixed++;
    }
    
    if (matches.rows.length > 10) {
      console.log(`\n... und ${matches.rows.length - 10} weitere Matches`);
    }
    
    console.log(`\n✅ ${matches.rows.length} Matches korrigiert\n`);
    
    // 3. Korrigiere Competitions-Tabelle
    console.log('🏆 Korrigiere Competitions...');
    console.log('=' .repeat(80));
    
    const compsQuery = `
      SELECT id, name, area_name
      FROM competitions
      WHERE name LIKE '%├%'
         OR area_name LIKE '%├%'
    `;
    
    const comps = await client.query(compsQuery);
    
    for (const comp of comps.rows) {
      const newName = fixEncoding(comp.name);
      const newAreaName = fixEncoding(comp.area_name);
      
      console.log(`\nCompetition ID ${comp.id}:`);
      if (newName !== comp.name) {
        console.log(`  Name: "${comp.name}" → "${newName}"`);
      }
      if (newAreaName !== comp.area_name) {
        console.log(`  Area: "${comp.area_name}" → "${newAreaName}"`);
      }
      
      await client.query(
        `UPDATE competitions 
         SET name = $1, area_name = $2
         WHERE id = $3`,
        [newName, newAreaName, comp.id]
      );
      
      totalFixed++;
    }
    
    console.log(`\n✅ ${comps.rows.length} Competitions korrigiert\n`);
    
    // Commit der Transaktion
    await client.query('COMMIT');
    
    console.log('=' .repeat(80));
    console.log(`\n✅ ERFOLG! ${totalFixed} Einträge korrigiert\n`);
    console.log('💡 Starte den Server neu, um die Änderungen zu sehen.\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fehler bei der Korrektur:', error);
    console.log('\n⚠️  Alle Änderungen wurden zurückgerollt (ROLLBACK)\n');
  } finally {
    client.release();
    await pool.end();
  }
}

// Script ausführen
fixEncodingInDatabase();
