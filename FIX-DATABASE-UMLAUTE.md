# Datenbank Umlaute Fix - Komplettlösung

## 🔍 Problem-Analyse

**Diagnose-Ergebnis:**
- ✅ Datenbank-Encoding: UTF8
- ✅ System-Locale: en_US.UTF-8
- ❌ **Daten in DB:** Falsch gespeichert (M├╝nchen statt München)

**Ursache:** Die Daten wurden beim Import mit falschem Encoding in die Datenbank geschrieben.

## ✅ Lösung: Daten neu importieren

### Option 1: Kompletter Neu-Import (EMPFOHLEN)

```bash
cd /var/www/betfinder2.0

# 1. Backup der aktuellen DB
pg_dump -U betfinder betfinder > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Datenbank leeren (VORSICHT!)
psql -U betfinder -d betfinder -h localhost -c "TRUNCATE teams, matches, seasons, competitions, players RESTART IDENTITY CASCADE;"

# 3. .env prüfen/setzen
export PGCLIENTENCODING=UTF8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 4. Daten neu importieren mit korrektem Encoding
node import-all-data.js
```

### Option 2: Nur bestimmte Tabellen neu importieren

```bash
# Teams neu importieren
psql -U betfinder -d betfinder -h localhost << 'EOF'
TRUNCATE teams RESTART IDENTITY CASCADE;
EOF

# Dann mit Node.js neu importieren
node -e "
const { importTeams } = require('./import-all-data.js');
importTeams().then(() => console.log('✅ Teams neu importiert'));
"
```

### Option 3: Daten in der DB konvertieren (NUR wenn Import nicht möglich)

```bash
# 1. BACKUP ERSTELLEN!
pg_dump -U betfinder betfinder > backup_before_fix.sql

# 2. Vorschau der Änderungen
psql -U betfinder -d betfinder -h localhost -f fix-db-encoding.sql

# 3. Wenn OK, dann echte Konvertierung:
psql -U betfinder -d betfinder -h localhost << 'EOF'
BEGIN;

-- Teams konvertieren
UPDATE teams 
SET name = convert_from(convert_to(name, 'LATIN1'), 'UTF8')
WHERE name ~ '[├╝╗]';  -- Regex für fehlerhafte Zeichen

-- Weitere Tabellen falls nötig:
UPDATE competitions
SET name = convert_from(convert_to(name, 'LATIN1'), 'UTF8')
WHERE name ~ '[├╝╗]';

UPDATE competitions
SET area_name = convert_from(convert_to(area_name, 'LATIN1'), 'UTF8')
WHERE area_name ~ '[├╝╗]';

COMMIT;
EOF
```

## 🎯 Empfohlener Workflow

### Schritt 1: Backup
```bash
cd /var/www/betfinder2.0
pg_dump -U betfinder betfinder | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Schritt 2: Environment vorbereiten
```bash
# In .bashrc permanent speichern
cat >> ~/.bashrc << 'EOF'
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PGCLIENTENCODING=UTF8
EOF

source ~/.bashrc
```

### Schritt 3: Datenbank neu aufsetzen
```bash
# Git Pull (neueste Version)
git pull origin main

# Node Dependencies aktualisieren
npm install

# Tabellen neu erstellen
node init-database.js

# Daten importieren (mit UTF-8)
node import-all-data.js
```

### Schritt 4: Backend neu starten
```bash
pm2 restart all
pm2 logs --lines 50
```

### Schritt 5: Testen
```bash
# Test 1: Direkter DB-Query
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost \
  -c "SELECT name FROM teams WHERE name LIKE '%Bayern%' LIMIT 3;"

# Test 2: API
curl http://localhost:3001/api/test-encoding

# Test 3: Frontend
curl https://betfinder.cloud/api/test-encoding
```

## 📊 Erwartetes Ergebnis

**Vorher:**
```
FC Bayern M├╝nchen
1. FC K├╢ln
```

**Nachher:**
```
FC Bayern München
1. FC Köln
```

## ⚠️ Wichtig

1. **IMMER BACKUP MACHEN** vor Änderungen
2. Users-Tabelle nicht löschen (Accounts bleiben erhalten)
3. Nach Import: PM2 neu starten
4. Test in allen Bereichen: psql, API, Frontend

## 🆘 Rollback falls Probleme

```bash
# Backup wiederherstellen
gunzip < backup_DATUM.sql.gz | psql -U betfinder -d betfinder -h localhost

# Oder
psql -U betfinder -d betfinder -h localhost < backup_before_fix.sql
```

## ✅ Checkliste

- [ ] Backup erstellt
- [ ] Environment-Variablen gesetzt (LANG, LC_ALL, PGCLIENTENCODING)
- [ ] Git Pull durchgeführt
- [ ] Datenbank neu importiert
- [ ] PM2 neu gestartet
- [ ] Tests durchgeführt
- [ ] Umlaute korrekt ✨
