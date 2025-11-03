# Umlaut-Fix für Betfinder Datenbank

## 🎯 Was macht das Skript?

`fix-umlaute-db.js` ersetzt falsch kodierte Umlaute direkt in der Datenbank:
- `M├╝nchen` → `München`
- `K├╢ln` → `Köln`
- `N├╝rnberg` → `Nürnberg`

## ⚠️ Wichtig: Backup erstellen!

```bash
# AUF DEM SERVER:
cd /var/www/betfinder2.0

# Backup erstellen
pg_dump -U betfinder betfinder > backup_before_umlaut_fix_$(date +%Y%m%d_%H%M%S).sql

# Komprimiertes Backup
pg_dump -U betfinder betfinder | gzip > backup_before_umlaut_fix_$(date +%Y%m%d).sql.gz
```

## 🚀 Ausführung

### Auf dem Server:

```bash
# 1. Zum Projekt-Verzeichnis
cd /var/www/betfinder2.0

# 2. Neueste Version holen
git pull origin main

# 3. Skript ausführen
node fix-umlaute-db.js
```

### Lokal testen (Windows):

```bash
# Im Projekt-Verzeichnis
node fix-umlaute-db.js
```

## 📊 Was passiert?

1. **Warnung & Countdown:** 5 Sekunden Zeit zum Abbrechen (Strg+C)
2. **Teams-Tabelle:** Korrigiert name, short_name, tla, venue, club_colors
3. **Competitions-Tabelle:** Korrigiert name, area_name
4. **Seasons-Tabelle:** Korrigiert winner_name
5. **Players-Tabelle:** Korrigiert name, first_name, last_name, nationality (falls vorhanden)
6. **Test-Query:** Zeigt Beispiel-Teams zur Verifikation

## 📋 Ausgabe-Beispiel:

```
🔧 Umlaut-Korrektur Skript
══════════════════════════════════════════════════
⚠️  WARNUNG: Dieses Skript ändert Daten in der Datenbank!
══════════════════════════════════════════════════

⚠️  WICHTIG: Erstelle vorher ein Backup:
   pg_dump -U betfinder betfinder > backup_before_fix.sql

⏳ Starte in 5 Sekunden...

📋 Verarbeite Tabelle: teams
──────────────────────────────────────────────────
🔧 name: 150 Einträge gefunden
   Vorher: FC Bayern M├╝nchen
   Nachher: FC Bayern München
   Vorher: 1. FC K├╢ln
   Nachher: 1. FC Köln
   Vorher: 1. FC N├╝rnberg
   Nachher: 1. FC Nürnberg
✅ name: 150 Einträge korrigiert

══════════════════════════════════════════════════
✅ Fertig! 327 Einträge korrigiert
══════════════════════════════════════════════════

🔍 Test-Query:
   ✓ FC Bayern München
   ✓ 1. FC Köln
   ✓ 1. FC Nürnberg
```

## ✅ Verifizierung

### Nach dem Fix testen:

```bash
# 1. Direkter DB-Test
PGPASSWORD=$DB_PASSWORD psql -U betfinder -d betfinder -h localhost \
  -c "SELECT name FROM teams WHERE name LIKE '%Bayern%' LIMIT 3;"

# Sollte ausgeben:
# FC Bayern München
# FC Bayern München II

# 2. API-Test
curl http://localhost:3001/api/test-encoding

# 3. Frontend-Test
curl https://betfinder.cloud/api/test-encoding
```

### Backend neu starten:

```bash
pm2 restart all
pm2 logs --lines 20
```

## 🔄 Wiederholen falls nötig

Falls nach dem ersten Durchlauf noch fehlerhafte Zeichen gefunden werden:

```bash
# Einfach nochmal ausführen
node fix-umlaute-db.js
```

Das Skript findet nur noch nicht korrigierte Einträge.

## 🆘 Rollback

Falls etwas schief geht:

```bash
# Backup wiederherstellen
psql -U betfinder -d betfinder -h localhost < backup_before_umlaut_fix_DATUM.sql

# Oder komprimiert:
gunzip < backup_before_umlaut_fix_DATUM.sql.gz | psql -U betfinder -d betfinder -h localhost

# Backend neu starten
pm2 restart all
```

## 📝 Betroffene Tabellen & Spalten

- **teams:** name, short_name, tla, venue, club_colors
- **competitions:** name, area_name
- **seasons:** winner_name
- **players:** name, first_name, last_name, nationality

## ✨ Nach dem Fix

Die API und das Frontend sollten nun korrekte Umlaute anzeigen:
- ✅ München (nicht M├╝nchen)
- ✅ Köln (nicht K├╢ln)
- ✅ Nürnberg (nicht N├╝rnberg)

## 🔧 Technische Details

Das Skript verwendet String-Replacement für bekannte fehlerhafte Zeichen-Kombinationen:
- `├╝` → `ü`
- `├Ü` → `Ü`
- `├╢` → `ö`
- `├ö` → `Ö`
- `├ñ` → `ä`
- `├Ñ` → `Ä`
- `├ƒ` → `ß`

Weitere Zeichen für Französisch, Spanisch, etc. sind ebenfalls enthalten.
