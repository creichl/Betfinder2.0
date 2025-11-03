# Cloud-Datenbank Encoding testen

## Schritt 1: Auf den Server verbinden
```bash
ssh root@betfinder.cloud
```

## Schritt 2: Test-Script erstellen
```bash
cd /var/www/betfinder

cat > test-encoding-cloud.js << 'EOF'
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

async function test() {
  try {
    console.log('🔍 Cloud-DB Encoding Test\n');
    console.log('=' .repeat(80));
    
    // 1. Teams-Tabelle testen
    console.log('\n📊 TEAMS-TABELLE:');
    const teams = await pool.query(`
      SELECT id, name FROM teams 
      WHERE name LIKE '%Bayern%' OR name LIKE '%Köln%' OR name LIKE '%Nürnberg%'
      LIMIT 5
    `);
    
    teams.rows.forEach(t => {
      const hasError = t.name.includes('├');
      console.log(`  ${t.id}: "${t.name}" ${hasError ? '❌ ENCODING-FEHLER' : '✅ OK'}`);
    });
    
    // 2. Matches-Tabelle testen
    console.log('\n⚽ MATCHES-TABELLE:');
    const matches = await pool.query(`
      SELECT id, home_team_name, away_team_name 
      FROM matches 
      WHERE home_team_name LIKE '%München%' OR away_team_name LIKE '%München%'
      LIMIT 3
    `);
    
    matches.rows.forEach(m => {
      const homeError = m.home_team_name && m.home_team_name.includes('├');
      const awayError = m.away_team_name && m.away_team_name.includes('├');
      console.log(`\n  Match ${m.id}:`);
      console.log(`    Heim: "${m.home_team_name}" ${homeError ? '❌ FEHLER' : '✅ OK'}`);
      console.log(`    Auswärts: "${m.away_team_name}" ${awayError ? '❌ FEHLER' : '✅ OK'}`);
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n💡 ANALYSE:');
    console.log('   ✅ OK = Umlaute korrekt gespeichert');
    console.log('   ❌ FEHLER = Falsche Encoding in DB (├ Zeichen gefunden)');
    console.log('\nWenn FEHLER: Führe fix-encoding-data.js aus\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

test();
EOF
```

## Schritt 3: Script ausführen
```bash
node test-encoding-cloud.js
```

## Schritt 4: Ergebnis interpretieren

### ✅ Wenn alles OK ist:
- Umlaute sind korrekt in der DB
- Problem liegt im Frontend-Cache oder Build
- Lösung: Hard Reload im Browser (Ctrl+Shift+R) oder Frontend neu bauen

### ❌ Wenn Fehler angezeigt werden:
- Umlaute sind falsch in der Cloud-DB gespeichert
- Lösung: Korrektur-Script ausführen:

```bash
# Diagnose-Script kopieren
cat > diagnose-encoding.js << 'EOF'
[Inhalt von diagnose-encoding.js]
EOF

# Korrektur-Script kopieren
cat > fix-encoding-data.js << 'EOF'
[Inhalt von fix-encoding-data.js]
EOF

# Erst Diagnose
node diagnose-encoding.js

# Dann Korrektur (wenn nötig)
node fix-encoding-data.js

# PM2 neu starten
pm2 restart ecosystem.config.js
```

## Alternative: Direkt über psql testen
```bash
psql -U postgres -d betfinder -c "SELECT name FROM teams WHERE name LIKE '%München%' LIMIT 3;"
```

Wenn hier falsche Zeichen angezeigt werden, ist die DB betroffen.
