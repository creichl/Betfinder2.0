#!/bin/bash
# test-cloud-encoding.sh
# Testet das Encoding auf dem Cloud-Server

echo "🔍 Teste Cloud-Datenbank Encoding..."
echo ""

# Script zum Server kopieren und ausführen
ssh root@betfinder.cloud << 'ENDSSH'
cd /var/www/betfinder

# Test-Script erstellen
cat > /tmp/test-encoding.js << 'EOF'
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
    console.log('📊 Cloud-DB Test:\n');
    
    // 1. Teams-Tabelle
    const teams = await pool.query(`
      SELECT id, name FROM teams 
      WHERE name LIKE '%Bayern%' OR name LIKE '%Köln%' OR name LIKE '%Nürnberg%'
      LIMIT 5
    `);
    
    console.log('Teams:');
    teams.rows.forEach(t => {
      const hasError = t.name.includes('├');
      console.log(`  ${t.id}: "${t.name}" ${hasError ? '❌ FEHLER' : '✅'}`);
    });
    
    // 2. Matches-Tabelle
    const matches = await pool.query(`
      SELECT id, home_team_name, away_team_name 
      FROM matches 
      WHERE home_team_name LIKE '%München%' OR away_team_name LIKE '%München%'
      LIMIT 3
    `);
    
    console.log('\nMatches:');
    matches.rows.forEach(m => {
      const homeError = m.home_team_name && m.home_team_name.includes('├');
      const awayError = m.away_team_name && m.away_team_name.includes('├');
      console.log(`  ${m.id}:`);
      console.log(`    Heim: "${m.home_team_name}" ${homeError ? '❌' : '✅'}`);
      console.log(`    Auswärts: "${m.away_team_name}" ${awayError ? '❌' : '✅'}`);
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

test();
EOF

# Script ausführen
node /tmp/test-encoding.js

ENDSSH
