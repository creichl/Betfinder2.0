# ✅ Lösung: Umlaute in Match-Cards korrigieren

## Problem
- Teams-Tabelle: ✅ Korrekt ("München", "Köln")
- Matches-Tabelle: ❌ Falsche Encoding ("M├╝nchen")
- Ergebnis: Match-Cards zeigen falsche Teamnamen

## Lösung
Die Teamnamen in der matches-Tabelle müssen aus der korrekten teams-Tabelle synchronisiert werden.

## Schritt-für-Schritt Anleitung

### 1. Auf den Server verbinden
```bash
ssh root@betfinder.cloud
```

### 2. In das Projekt-Verzeichnis wechseln
```bash
cd /var/www/betfinder
```

### 3. Sync-Script erstellen
```bash
cat > sync-matches-teamnames.js << 'EOF'
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

async function syncTeamNames() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Synchronisiere Teamnamen in matches-Tabelle...\n');
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // Zeige Beispiele VORHER
    console.log('\n📊 VORHER (Beispiele):');
    const beforeQuery = `
      SELECT m.id, m.home_team_name, m.away_team_name,
             ht.name as correct_home, at.name as correct_away
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_team_name LIKE '%├%' OR m.away_team_name LIKE '%├%'
      LIMIT 5
    `;
    
    const before = await client.query(beforeQuery);
    before.rows.forEach(m => {
      console.log(`\nMatch ${m.id}:`);
      console.log(`  Heim: "${m.home_team_name}" → "${m.correct_home}"`);
      console.log(`  Auswärts: "${m.away_team_name}" → "${m.correct_away}"`);
    });
    
    // Zähle betroffene Matches
    const countQuery = `
      SELECT COUNT(*) as total
      FROM matches
      WHERE home_team_name LIKE '%├%' OR away_team_name LIKE '%├%'
    `;
    
    const count = await client.query(countQuery);
    const total = parseInt(count.rows[0].total);
    
    console.log(`\n📈 Anzahl betroffener Matches: ${total}`);
    
    if (total === 0) {
      console.log('\n✅ Keine fehlerhaften Einträge gefunden!');
      await client.query('ROLLBACK');
      return;
    }
    
    // Update durchführen
    console.log('\n🔧 Starte Update...');
    
    const updateQuery = `
      UPDATE matches m
      SET 
        home_team_name = ht.name,
        away_team_name = at.name
      FROM teams ht, teams at
      WHERE m.home_team_id = ht.id 
        AND m.away_team_id = at.id
        AND (m.home_team_name LIKE '%├%' OR m.away_team_name LIKE '%├%')
    `;
    
    const result = await client.query(updateQuery);
    console.log(`✅ ${result.rowCount} Matches aktualisiert`);
    
    // Zeige Beispiele NACHHER
    console.log('\n📊 NACHHER (Beispiele):');
    const afterQuery = `
      SELECT id, home_team_name, away_team_name
      FROM matches
      WHERE home_team_name LIKE '%München%' OR away_team_name LIKE '%München%'
      LIMIT 5
    `;
    
    const after = await client.query(afterQuery);
    after.rows.forEach(m => {
      console.log(`\nMatch ${m.id}:`);
      console.log(`  Heim: "${m.home_team_name}"`);
      console.log(`  Auswärts: "${m.away_team_name}"`);
    });
    
    // Commit
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ ERFOLG! Teamnamen synchronisiert');
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

syncTeamNames();
EOF
```

### 4. Script ausführen
```bash
node sync-matches-teamnames.js
```

### 5. PM2 neu starten
```bash
pm2 restart ecosystem.config.js
```

### 6. Testen
Öffne https://betfinder.cloud und drücke **Ctrl + Shift + R** für einen Hard Reload.

## Was macht das Script?
1. Findet alle Matches mit falsch codierten Teamnamen (├ Zeichen)
2. Holt die korrekten Namen aus der teams-Tabelle via JOIN
3. Updated die matches-Tabelle mit den korrekten Namen
4. Zeigt Vorher/Nachher Beispiele

## Sicherheit
- Verwendet Transaktionen (BEGIN/COMMIT)
- Bei Fehler: Automatischer ROLLBACK
- Nur Matches mit falschem Encoding werden geändert

## Erwartetes Ergebnis
Nach dem Script sollten alle Match-Cards die korrekten Teamnamen anzeigen:
- ✅ "FC Bayern München" (statt "FC Bayern M├╝nchen")
- ✅ "1. FC Köln" (statt "1. FC K├Âln")
- ✅ "1. FC Nürnberg" (statt "1. FC N├╝rnberg")
