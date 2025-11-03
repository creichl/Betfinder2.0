// test-matches-encoding.js
// Testet das Encoding der Matches API direkt

require('dotenv').config();
const { pool } = require('./database');

async function testMatchesEncoding() {
  try {
    console.log('🔍 Teste Matches API Encoding...\n');
    
    // Simuliere die Matches-Route Query
    const query = `
      SELECT 
        m.id,
        m.home_team_name,
        m.away_team_name,
        m.venue,
        
        ht.name as home_team_db_name,
        at.name as away_team_db_name,
        
        c.name as competition_name
        
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN competitions c ON m.competition_id = c.id
      WHERE m.home_team_name LIKE '%München%' 
         OR m.away_team_name LIKE '%München%'
         OR m.home_team_name LIKE '%Köln%'
         OR m.away_team_name LIKE '%Köln%'
      ORDER BY m.utc_date DESC
      LIMIT 5
    `;
    
    const result = await pool.query(query);
    
    console.log('📊 Gefundene Matches:\n');
    console.log('=' .repeat(80));
    
    result.rows.forEach((match, index) => {
      console.log(`\n${index + 1}. Match ID: ${match.id}`);
      console.log(`   Heim (matches.home_team_name): "${match.home_team_name}"`);
      console.log(`   Heim (teams.name via JOIN):    "${match.home_team_db_name}"`);
      console.log(`   Auswärts (matches.away_team_name): "${match.away_team_name}"`);
      console.log(`   Auswärts (teams.name via JOIN):    "${match.away_team_db_name}"`);
      console.log(`   Competition: "${match.competition_name}"`);
      console.log(`   Venue: "${match.venue}"`);
      
      // Prüfe ob Umlaute korrekt sind
      const hasWrongEncoding = 
        (match.home_team_name && match.home_team_name.includes('├')) ||
        (match.away_team_name && match.away_team_name.includes('├')) ||
        (match.venue && match.venue.includes('├'));
      
      if (hasWrongEncoding) {
        console.log('   ⚠️  ENCODING-PROBLEM GEFUNDEN!');
      } else {
        console.log('   ✅ Encoding OK');
      }
    });
    
    console.log('\n' + '=' .repeat(80));
    
    // Teste auch direkt die teams Tabelle
    console.log('\n📊 Direkter Teams-Test:\n');
    console.log('=' .repeat(80));
    
    const teamsQuery = `
      SELECT id, name
      FROM teams
      WHERE name LIKE '%München%' OR name LIKE '%Köln%' OR name LIKE '%Nürnberg%'
      LIMIT 5
    `;
    
    const teams = await pool.query(teamsQuery);
    
    teams.rows.forEach(team => {
      console.log(`\nTeam ID ${team.id}: "${team.name}"`);
      if (team.name.includes('├')) {
        console.log('  ⚠️  ENCODING-PROBLEM!');
      } else {
        console.log('  ✅ OK');
      }
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n💡 Analyse:');
    console.log('   - Wenn teams.name korrekt ist, aber matches.home_team_name falsch,');
    console.log('     dann sind die Daten in der matches-Tabelle falsch gespeichert.');
    console.log('   - Lösung: Aktualisiere matches.home_team_name und away_team_name');
    console.log('     aus der teams-Tabelle.\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await pool.end();
  }
}

testMatchesEncoding();
