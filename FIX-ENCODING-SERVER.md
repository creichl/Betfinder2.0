# UTF-8 Encoding Fix für IONOS Server

## 🎯 Problem
Umlaute werden auf dem Server falsch angezeigt (z.B. "München" → "M├╝nchen")

## ✅ Lösung

### 1. Dateien auf Server hochladen

**Via Git (empfohlen):**
```bash
cd /var/www/betfinder2.0
git pull origin main
```

**Via SFTP:**
- `database.js` (mit UTF-8 Config)
- `check-encoding.sh` (Diagnose-Tool)

### 2. Systemweites UTF-8 setzen

```bash
# Locale auf UTF-8 setzen
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Permanent in .bashrc speichern
echo 'export LANG=en_US.UTF-8' >> ~/.bashrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bashrc
source ~/.bashrc
```

### 3. PostgreSQL Client-Encoding setzen

```bash
# Für aktuelles Terminal
export PGCLIENTENCODING=UTF8

# Permanent in .bashrc
echo 'export PGCLIENTENCODING=UTF8' >> ~/.bashrc
source ~/.bashrc
```

### 4. Node.js neu starten

```bash
cd /var/www/betfinder2.0
pm2 restart all

# Oder manuell:
pm2 stop all
pm2 delete all
pm2 start server.js --name backend
pm2 save
```

### 5. Testen

**Option A: Mit Diagnose-Skript**
```bash
cd /var/www/betfinder2.0
chmod +x check-encoding.sh
./check-encoding.sh
```

**Option B: Manuell**
```bash
# Test psql (sollte nun korrekt sein)
psql -U betfinder -d betfinder -h localhost -c "SELECT name FROM teams WHERE name LIKE '%Bayern M%' LIMIT 3;" -t

# Test API
curl http://localhost:3001/api/test-encoding

# Test Web-Frontend
curl https://betfinder.cloud/api/test-encoding
```

## 📊 Erwartetes Ergebnis

**Vorher (falsch):**
```
FC Bayern M├╝nchen
```

**Nachher (korrekt):**
```
FC Bayern München
```

## 🔧 Alternative: PostgreSQL Global konfigurieren

```bash
# PostgreSQL Config bearbeiten
sudo nano /etc/postgresql/*/main/postgresql.conf

# Diese Zeilen hinzufügen/ändern:
client_encoding = utf8
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'

# PostgreSQL neu starten
sudo systemctl restart postgresql
```

## ✅ Checkliste

- [ ] Git Pull oder Dateien hochgeladen
- [ ] LANG und LC_ALL auf UTF-8 gesetzt
- [ ] PGCLIENTENCODING=UTF8 exportiert
- [ ] Node.js neu gestartet (pm2 restart all)
- [ ] API-Test durchgeführt
- [ ] Frontend getestet
- [ ] Umlaute korrekt angezeigt ✨

## 🆘 Bei Problemen

**Test im psql:**
```sql
\l  -- Zeigt Datenbank-Encoding
SHOW SERVER_ENCODING;  -- Sollte UTF8 sein
SHOW CLIENT_ENCODING;  -- Sollte UTF8 sein
```

**Wenn CLIENT_ENCODING nicht UTF8 ist:**
```sql
SET CLIENT_ENCODING TO 'UTF8';
```

**In Node.js/database.js bereits implementiert:**
```javascript
client_encoding: 'UTF8',
options: '-c client_encoding=UTF8'
