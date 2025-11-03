#!/bin/bash
# check-encoding.sh - Prüfe UTF-8 Encoding auf dem Server

# Lade .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "================================================"
echo "🔍 Encoding-Diagnose für Betfinder"
echo "================================================"
echo ""

echo "1️⃣ Datenbank-Encoding:"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c "SHOW SERVER_ENCODING;" -t
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c "SHOW CLIENT_ENCODING;" -t
echo ""

echo "2️⃣ System-Locale:"
locale | grep -E "LANG|LC_ALL"
echo ""

echo "3️⃣ Test-Abfrage (mit UTF-8):"
PGCLIENTENCODING=UTF8 PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c "SELECT name FROM teams WHERE name LIKE '%Bayern M%' LIMIT 3;" -t
echo ""

echo "4️⃣ API-Test (Node.js):"
curl -s http://localhost:3001/api/test-encoding | jq -r '.teams[].name' 2>/dev/null || curl -s http://localhost:3001/api/test-encoding
echo ""

echo "================================================"
echo "✅ Diagnose abgeschlossen"
echo "================================================"
