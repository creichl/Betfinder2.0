// fix-umlaute-db.js - Korrigiert falsch kodierte Umlaute in der Datenbank
require('dotenv').config();
const { pool } = require('./database');

// Mapping von falschen zu korrekten Zeichen
const REPLACEMENTS = {
  '├╝': 'ü',
  '├£': 'Ü',
  '├╢': 'ö',
  '├û': 'Ö',
  '├ñ': 'ä',
  '├ä': 'Ä',
  '├ƒ': 'ß',
  '├⌐': 'é',
  '├¿': 'è',
  '├á': 'à',
  '├┤': 'ô',
  '├ó': 'â',
  '├¬': 'ê',
  '├«': 'î',
  '├»': 'ï',
  '├╣': 'ù',
  '├╗': 'û',
  '├½': 'ë',
  '├º': 'ç',
  '├Ç': 'Ã',
  '├í': 'á',
  '├¡': 'á',
  '├¡': 'í',
  '├│': 'ó',
  '├║': 'ú',
  '├▒': 'ñ',
  '├ú': 'Ú',
  '├Ä': 'Ä',
  '├ë': 'ë',
  '├ü': 'ü'
};

async function fixTable(tableName, columns) {
  console.log(`\n📋 Verarbeite Tabelle: ${tableName}`);
  console.log('─'.repeat(50));
  
  let totalFixed = 0;
  
  for (const column of columns) {
    try {
      // Finde betroffene Zeilen
      const checkQuery = `
        SELECT id, ${column} as value
        FROM ${tableName}
        WHERE ${column} ~ '[├╝╗╢]'
        LIMIT 1000
      `;
      
      const result = await pool.query(checkQuery);
      
      if (result.rows.length === 0) {
        console.log(`✅ ${column}: Keine Fehler gefunden`);
        continue;
      }
      
      console.log(`🔧 ${column}: ${result.rows.length} Einträge gefunden`);
      
      // Zeige Beispiele
      const examples = result.rows.slice(0, 3);
      examples.forEach(row => {
        let fixed = row.value;
        Object.keys(REPLACEMENTS).forEach(bad => {
          fixed = fixed.split(bad).join(REPLACEMENTS[bad]);
        });
        console.log(`   Vorher: ${row.value}`);
        console.log(`   Nachher: ${fixed}`);
      });
      
      // Update durchführen
      let fixed = 0;
      for (const row of result.rows) {
        let newValue = row.value;
        Object.keys(REPLACEMENTS).forEach(bad => {
          newValue = newValue.split(bad).join(REPLACEMENTS[bad]);
        });
        
        if (newValue !== row.value) {
          await pool.query(
            `UPDATE ${tableName} SET ${column} = $1 WHERE id = $2`,
            [newValue, row.id]
          );
          fixed++;
        }
      }
      
      totalFixed += fixed;
      console.log(`✅ ${column}: ${fixed} Einträge korrigiert`);
      
    } catch (error) {
      console.error(`❌ Fehler bei ${tableName}.${column}:`, error.message);
    }
  }
  
  return totalFixed;
}

async function main() {
  console.log('\n🔧 Umlaut-Korrektur Skript');
  console.log('═'.repeat(50));
  console.log('⚠️  WARNUNG: Dieses Skript ändert Daten in der Datenbank!');
  console.log('═'.repeat(50));
  
  try {
    // Backup-Warnung
    console.log('\n⚠️  WICHTIG: Erstelle vorher ein Backup:');
    console.log('   pg_dump -U betfinder betfinder > backup_before_fix.sql');
    console.log('\n⏳ Starte in 5 Sekunden...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let totalFixed = 0;
    
    // Teams
    totalFixed += await fixTable('teams', ['name', 'short_name', 'tla', 'venue', 'club_colors']);
    
    // Competitions
    totalFixed += await fixTable('competitions', ['name', 'area_name']);
    
    // Seasons
    totalFixed += await fixTable('seasons', ['winner_name']);
    
    // Players (falls vorhanden)
    try {
      totalFixed += await fixTable('players', ['name', 'first_name', 'last_name', 'nationality']);
    } catch (e) {
      console.log('ℹ️  Players-Tabelle übersprungen');
    }
    
    console.log('\n═'.repeat(50));
    console.log(`✅ Fertig! ${totalFixed} Einträge korrigiert`);
    console.log('═'.repeat(50));
    
    // Test-Query
    console.log('\n🔍 Test-Query:');
    const testResult = await pool.query(
      "SELECT name FROM teams WHERE name LIKE '%Bayern%' OR name LIKE '%Köln%' LIMIT 5"
    );
    testResult.rows.forEach(row => {
      console.log(`   ✓ ${row.name}`);
    });
    
  } catch (error) {
    console.error('\n❌ Fehler:', error);
  } finally {
    await pool.end();

    process.exit(0);
  }
}
// Starte Skript
main();
