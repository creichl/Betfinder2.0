#!/bin/bash
# check-encoding.sh - Prüfe UTF-8 Encoding auf dem Server

echo "================================================"
echo "🔍 Encoding-Diagnose für Betfinder"
echo "================================================"
echo ""

echo "1️⃣ Datenbank-Encoding:"
psql -U betfinder -d betfinder -h localhost -c "SHOW SERVER_ENCODING;" -t
psql -U betfinder -d betfinder -h localhost -c "SHOW CLIENT_ENCODING;" -t
echo ""

echo "2️⃣ System-Locale:"
locale | grep -E "LANG|LC_ALL"
echo ""

echo "3️⃣ Test-Abfrage (mit UTF-8):"
PGCLIENTENCODING=UTF8 psql -U betfinder -d betfinder -h localhost -c "SELECT name FROM teams WHERE name LIKE '%Bayern M%' LIMIT 3;" -t
echo ""

echo "4️⃣ API-Test (Node.js):"
curl -s http://localhost:3001/api/test-encoding | jq -r '.teams[].name'
echo ""

echo "================================================"
echo "✅ Diagnose abgeschlossen"
echo "================================================"
