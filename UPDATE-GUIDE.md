# 🔄 Daten-Update Guide

Dieses Dokument erklärt, wie du die Football-Datenbank effizient aktualisierst, ohne jedes Mal alle Daten neu zu laden.

## 📋 Übersicht

- **`import-all-data.js`** - Initialer Vollimport (einmalig oder selten)
- **`update-data.js`** - Intelligente Updates (täglich/stündlich)

## 🚀 Update-Modi

### 1. 🔴 Live Modus
**Zweck:** Update nur für laufende und geplante Matches  
**Verwendung:** Während Spieltagen für Live-Scores

```bash
node update-data.js live
```

**Was wird aktualisiert:**
- Alle Matches mit Status: `IN_PLAY`, `PAUSED`, `LIVE`, `SCHEDULED`, `TIMED`
- Nur Matches der letzten 2 Tage

**API Requests:** ~10-50 (je nach aktiven Matches)  
**Dauer:** 1-5 Minuten  
**Empfohlen:** Alle 10-30 Minuten während Spieltagen

---

### 2. 📅 Recent Modus (Standard)
**Zweck:** Update für aktuelle und kommende Matches  
**Verwendung:** Tägliches Standard-Update

```bash
node update-data.js recent
# oder einfach:
node update-data.js
```

**Was wird aktualisiert:**
- Alle Matches der letzten 7 Tage
- Alle Matches der nächsten 14 Tage
- Für alle Competitions in der DB

**API Requests:** ~50-200  
**Dauer:** 5-15 Minuten  
**Empfohlen:** Einmal täglich (nachts)

---

### 3. 📅 Today Modus
**Zweck:** Nur heutige Matches  
**Verwendung:** Schnelles Update für heute

```bash
node update-data.js today
```

**Was wird aktualisiert:**
- Nur Matches von heute und morgen

**API Requests:** ~20-80  
**Dauer:** 2-8 Minuten  
**Empfohlen:** Mehrmals täglich

---

### 4. 📅 Week Modus
**Zweck:** Update für diese Woche  
**Verwendung:** Wöchentliches Update

```bash
node update-data.js week
```

**Was wird aktualisiert:**
- Matches der letzten 3 Tage
- Matches der nächsten 7 Tage

**API Requests:** ~30-120  
**Dauer:** 3-10 Minuten  
**Empfohlen:** 2-3x pro Woche

---

### 5. 📅 Season Modus
**Zweck:** Komplette aktuelle Season  
**Verwendung:** Größeres Update mit Tabellen und Top-Scorern

```bash
node update-data.js season
```

**Was wird aktualisiert:**
- Alle Matches der aktuellen Season
- Tabellenstände
- Top Scorer
- Für alle Competitions

**API Requests:** ~100-500  
**Dauer:** 10-30 Minuten  
**Empfohlen:** Einmal pro Woche (Sonntag nachts)

---

### 6. 🧠 Smart Modus
**Zweck:** Intelligentes Update basierend auf Timestamps  
**Verwendung:** Minimale API-Nutzung

```bash
node update-data.js smart
```

**Was wird aktualisiert:**
- Nur Matches die seit >24h nicht updated wurden UND nicht FINISHED sind
- Live/laufende Matches
- Max. 100 Matches

**API Requests:** ~10-100  
**Dauer:** 1-10 Minuten  
**Empfohlen:** Mehrmals täglich

---

## 📊 Vergleich

| Modus | API Requests | Dauer | Wann nutzen? |
|-------|-------------|-------|--------------|
| **live** | 10-50 | 1-5 min | Während Spieltagen alle 10-30 min |
| **recent** | 50-200 | 5-15 min | Täglich nachts |
| **today** | 20-80 | 2-8 min | Mehrmals täglich |
| **week** | 30-120 | 3-10 min | 2-3x pro Woche |
| **season** | 100-500 | 10-30 min | Wöchentlich (Sonntag) |
| **smart** | 10-100 | 1-10 min | Mehrmals täglich |

---

## ⚙️ Automatisierung mit Cron

### Linux/Mac (crontab)

```bash
# Crontab öffnen
crontab -e

# Tägliches Update um 3:00 Uhr nachts
0 3 * * * cd /pfad/zu/betfinder2.0 && node update-data.js recent >> logs/update.log 2>&1

# Live-Updates während Spieltagen (Sa/So 14-23 Uhr, alle 15 min)
*/15 14-23 * * 6-0 cd /pfad/zu/betfinder2.0 && node update-data.js live >> logs/live-update.log 2>&1

# Wöchentliches Season-Update (Sonntag 4:00 Uhr)
0 4 * * 0 cd /pfad/zu/betfinder2.0 && node update-data.js season >> logs/season-update.log 2>&1

# Smart Update alle 6 Stunden
0 */6 * * * cd /pfad/zu/betfinder2.0 && node update-data.js smart >> logs/smart-update.log 2>&1
```

### Windows (Task Scheduler)

1. Task Scheduler öffnen
2. "Create Basic Task" wählen
3. Name: "Football Data Update"
4. Trigger: Daily, 3:00 AM
5. Action: Start a program
   - Program: `node`
   - Arguments: `update-data.js recent`
   - Start in: `C:\work\betfinder2.0`

---

## 🎯 Empfohlene Konfiguration

### Minimal Setup (für Hobby-Projekt)
```bash
# Einmal täglich nachts
0 3 * * * node update-data.js recent
```

### Standard Setup
```bash
# Täglich nachts
0 3 * * * node update-data.js recent

# Smart Update alle 12 Stunden
0 */12 * * * node update-data.js smart

# Season Update Sonntag nachts
0 4 * * 0 node update-data.js season
```

### Pro Setup (mit Live-Updates)
```bash
# Täglich nachts
0 3 * * * node update-data.js recent

# Smart Update alle 6 Stunden
0 */6 * * * node update-data.js smart

# Live während Spieltagen (Fr-So, 14-23 Uhr)
*/15 14-23 * * 5-0 node update-data.js live

# Season Update Sonntag nachts
0 4 * * 0 node update-data.js season
```

---

## 💡 Tipps & Best Practices

### 1. API Rate Limits beachten
- Free Tier: 10 Requests/Minute
- Tier One: 30 Requests/Minute
- **Tier Four: 500 Requests/Minute** (aktuell verwendet)

### 2. Logs anlegen
```bash
# Logs-Ordner erstellen
mkdir logs

# Log-Rotation mit logrotate (Linux)
sudo nano /etc/logrotate.d/football-updates
```

```
/pfad/zu/betfinder2.0/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

### 3. Monitoring
```bash
# Status prüfen
tail -f logs/update.log

# Letzte Update-Statistiken
tail -n 20 logs/update.log | grep "UPDATE STATISTIKEN" -A 10

# Fehler finden
grep "❌" logs/update.log
```

### 4. Database Backup vor großen Updates
```bash
# PostgreSQL Backup
pg_dump football_db > backup_$(date +%Y%m%d).sql

# Restore bei Bedarf
psql football_db < backup_20241102.sql
```

### 5. Update-Strategie nach Saison-Phase

**Saisonstart (Aug-Sep):**
```bash
# Häufige Updates wegen vieler Spieltage
node update-data.js season  # Wöchentlich
node update-data.js recent  # Täglich
```

**Hauptsaison (Okt-Mai):**
```bash
node update-data.js recent  # Täglich
node update-data.js live    # An Spieltagen
```

**Sommerpause (Jun-Jul):**
```bash
node update-data.js week    # 2x pro Woche
# Weniger Updates nötig
```

---

## 🔍 Troubleshooting

### Problem: Zu viele API Requests
```bash
# Lösung: Längere Pausen oder weniger häufige Updates
node update-data.js today  # Statt 'recent'
```

### Problem: Veraltete Daten
```bash
# Lösung: Einmal Season-Update durchführen
node update-data.js season
```

### Problem: Live-Scores nicht aktuell
```bash
# Lösung: Kürzere Update-Intervalle
*/10 * * * * node update-data.js live  # Alle 10 Minuten
```

---

## 📈 Performance-Optimierungen

### 1. Nur wichtige Competitions updaten
Bearbeite `update-data.js` um Competition-Filter hinzuzufügen:

```javascript
// Nur Top-5-Ligen
const topLeagues = [2002, 2014, 2015, 2019, 2021]; // PL, La Liga, Ligue 1, Serie A, Bundesliga

const compsResult = await pool.query(
  'SELECT id, name FROM competitions WHERE id = ANY($1) ORDER BY id',
  [topLeagues]
);
```

### 2. Parallelisierung (Vorsicht mit Rate Limits!)
```javascript
// In update-data.js
const chunks = competitions.reduce((acc, comp, i) => {
  const chunkIndex = Math.floor(i / 5);
  if (!acc[chunkIndex]) acc[chunkIndex] = [];
  acc[chunkIndex].push(comp);
  return acc;
}, []);

for (const chunk of chunks) {
  await Promise.all(chunk.map(comp => updateCompetition(comp)));
  await sleep(2000); // Pause zwischen Chunks
}
```

### 3. Database Indizes prüfen
```sql
-- Wichtige Indizes für schnelle Updates
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_updated ON matches(last_updated);
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches(utc_date, status);
```

---

## 📝 Beispiel-Output

```
🔄 STARTE DATEN-UPDATE
⏰ Start: 02.11.2025, 03:00:00

📅 Modus: Aktuelle Matches (Standard)
======================================================================
   Zeitraum: 7 Tage zurück bis 14 Tage voraus
   Von: 2025-10-26
   Bis: 2025-11-16

🏆 UEFA Champions League (ID: 2001)
   📊 45 Matches gefunden
   ✅ Update komplett

🏆 Premier League (ID: 2021)
   📊 20 Matches gefunden
   ✅ Update komplett

...

✅ UPDATE ABGESCHLOSSEN in 234 Sekunden
⏰ Beendet: 02.11.2025, 03:03:54

======================================================================
📊 UPDATE STATISTIKEN
======================================================================
📡 API Requests: 127
🏆 Competitions: 0
⚽ Matches: 12 neu, 89 updated, 43 unverändert
🏟️  Teams: 8
📊 Standings: 0
🥇 Top Scorers: 0
======================================================================
```

---

## 🎯 Fazit

Mit `update-data.js` hast du ein flexibles Update-System:

✅ **Effizient** - Nur nötige Daten werden geholt  
✅ **Flexibel** - 6 verschiedene Modi für jeden Bedarf  
✅ **Schnell** - Deutlich schneller als Vollimport  
✅ **API-schonend** - Minimale Request-Anzahl  
✅ **Automatisierbar** - Perfekt für Cron-Jobs  

**Von Vollimport (import-all-data.js):**
- 🕐 Dauer: 60-180 Minuten
- 📡 Requests: 2000-5000
- 💾 Alle Daten, alle Seasons

**Zu Update (update-data.js recent):**
- 🕐 Dauer: 5-15 Minuten
- 📡 Requests: 50-200
- 💾 Nur aktuelle & relevante Daten

**Das sind 90%+ weniger Zeit und API-Requests!** 🚀
