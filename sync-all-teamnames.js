// sync-all-teamnames.js
// Synchronisiert ALLE Teamnamen in matches-Tabelle aus der teams-Tabelle
// WICHTIG: Auf dem Cloud-Server ausführen!

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

async function syncAllTeamNames() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Synchronisiere ALLE Teamnamen in matches-Tabelle...\n');
    console.log('=' .repeat(80));
    
    await client.query('BEGIN');
    
    // 1. Zeige Beispiele mit Unterschieden
    console.log('\n📊 Teams mit Unterschieden (Beispiele):');
    const diffQuery = `
      SELECT m.id, 
             m.home_team_name, ht.name as correct_home,
             m.away_team_name, at.name as correct_away
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_team_name != ht.name OR m.away_team_name != at.name
      LIMIT 10
    `;
    
    const diff = await client.query(diffQuery);
    
    if (diff.rows.length > 0) {
      diff.rows.forEach(m => {
        console.log(`\nMatch ${m.id}:`);
        if (m.home_team_name !== m.correct_home) {
          console.log(`  Heim: "${m.home_team_name}" → "${m.correct_home}"`);
        }
        if (m.away_team_name !== m.correct_away) {
          console.log(`  Auswärts: "${m.away_team_name}" → "${m.correct_away}"`);
        }
      });
    } else {
      console.log('✅ Keine Unterschiede gefunden!');
    }
    
    // 2. Zähle zu aktualisierende Matches
    const countQuery = `
      SELECT COUNT(*) as total
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_team_name != ht.name OR m.away_team_name != at.name
    `;
    
    const count = await client.query(countQuery);
    const total = parseInt(count.rows[0].total);
    
    console.log(`\n📈 Anzahl zu aktualisierender Matches: ${total}`);
    
    if (total === 0) {
      console.log('\n✅ Alle Teamnamen sind bereits synchron!');
      await client.query('ROLLBACK');
      return;
    }
    
    // 3. Update durchführen - ALLE Teamnamen
    console.log('\n🔧 Starte Update...');
    
    const updateQuery = `
      UPDATE matches m
      SET 
        home_team_name = ht.name,
        away_team_name = at.name
      FROM teams ht, teams at
      WHERE m.home_team_id = ht.id 
        AND m.away_team_id = at.id
        AND (m.home_team_name != ht.name OR m.away_team_name != at.name)
    `;
    
    const result = await client.query(updateQuery);
    console.log(`✅ ${result.rowCount} Matches aktualisiert`);
    
    // 4. Zeige einige Beispiele NACHHER
    console.log('\n📊 NACHHER (Beispiele mit speziellen Zeichen):');
    const afterQuery = `
      SELECT id, home_team_name, away_team_name
      FROM matches
      WHERE home_team_name LIKE '%ø%' 
         OR away_team_name LIKE '%ø%'
         OR home_team_name LIKE '%ü%'
         OR away_team_name LIKE '%ü%'
         OR home_team_name LIKE '%ö%'
         OR away_team_name LIKE '%ö%'
      LIMIT 5
    `;
    
    const after = await client.query(afterQuery);
    after.rows.forEach(m => {
      console.log(`\nMatch ${m.id}:`);
      console.log(`  Heim: "${m.home_team_name}"`);
      console.log(`  Auswärts: "${m.away_team_name}"`);
    });
    
    // 5. Commit
    await client.query('COMMIT');
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ ERFOLG! Alle Teamnamen synchronisiert');
    console.log('\n💡 Nächste Schritte:');
    console.log('   1. PM2 neu starten: pm2 restart ecosystem.config.js');
    console.log('   2. Browser Cache leeren: Ctrl+Shift+R');
    console.log('   3. Testen auf: https://betfinder.cloud\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Fehler:', error);
    console.log('\n⚠️  Alle Änderungen wurden zurückgerollt (ROLLBACK)\n');
  } finally {
    client.release();
    await pool.end();
  }
}

syncAllTeamNames();
