# 🚀 BetFinder 2.0 - Deployment Guide

Vollständige Anleitung für das Deployment auf IONOS Linux Server (Ubuntu 24.04) mit Domain betfinder.cloud

## 📋 Voraussetzungen

- ✅ IONOS Linux Server (Ubuntu 24.04)
- ✅ SSH-Zugriff zum Server
- ✅ Domain betfinder.cloud (DNS auf Server-IP konfiguriert)
- ✅ Git Repository mit dem Code

---

## 🎯 Teil 1: Lokale Vorbereitung (Windows PC)

### 1.1 Git Repository vorbereiten

```bash
# Im Projektverzeichnis: C:\work\betfinder2.0

# Status prüfen
git status

# Neue Dateien hinzufügen
git add .env.example deploy-setup.sh nginx-config.conf ecosystem.config.js DEPLOYMENT.md

# Änderungen committen
git commit -m "Prepare for production deployment"

# Zu GitHub/GitLab pushen
git push origin main
```

**Wichtig:** Stelle sicher, dass `.env` NICHT committed wurde (ist in .gitignore)!

### 1.2 Git Repository URL notieren

Du brauchst die Clone-URL deines Repositories. Beispiele:
- GitHub: `https://github.com/USERNAME/betfinder2.0.git`
- GitLab: `https://gitlab.com/USERNAME/betfinder2.0.git`
- Private: `git@github.com:USERNAME/betfinder2.0.git` (benötigt SSH Key)

---

## 🖥️ Teil 2: Server Setup

### 2.1 Mit Server verbinden

```bash
# Von Windows PowerShell oder Terminal
ssh root@DEINE-SERVER-IP
# oder
ssh USERNAME@DEINE-SERVER-IP
```

### 2.2 Automatisches Setup-Script ausführen

```bash
# Deployment Script herunterladen
cd /tmp
wget https://raw.githubusercontent.com/YOUR-USERNAME/betfinder2.0/main/deploy-setup.sh
# ODER wenn bereits geclont:
# git clone YOUR-GIT-REPO-URL /tmp/betfinder-temp
# cp /tmp/betfinder-temp/deploy-setup.sh .

# Ausführbar machen
chmod +x deploy-setup.sh

# Script ausführen (dauert ca. 5-10 Minuten)
./deploy-setup.sh
```

**Was das Script macht:**
- ✅ Installiert Node.js 20.x
- ✅ Installiert PostgreSQL
- ✅ Installiert Nginx
- ✅ Installiert PM2
- ✅ Installiert Certbot (SSL)
- ✅ Erstellt PostgreSQL Datenbank + User
- ✅ Konfiguriert Firewall
- ✅ Erstellt Verzeichnis `/var/www/betfinder`

**Wichtig:** Das Script erstellt ein zufälliges PostgreSQL Passwort und speichert es in `/tmp/betfinder_db_creds.txt` - **NOTIERE DIR DIESES PASSWORT!**

```bash
# Passwort anzeigen
cat /tmp/betfinder_db_creds.txt
```

---

## 📥 Teil 3: Code auf Server deployen

### 3.1 Repository klonen

```bash
# Wechsle ins Deployment-Verzeichnis
cd /var/www/betfinder

# Clone Repository
git clone YOUR-GIT-REPO-URL .

# Beispiel:
# git clone https://github.com/USERNAME/betfinder2.0.git .
```

**Hinweis für private Repos:**
```bash
# SSH Key generieren (falls nötig)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Public Key anzeigen und zu GitHub/GitLab hinzufügen
cat ~/.ssh/id_ed25519.pub
```

### 3.2 Environment-Variablen konfigurieren

```bash
# Erstelle .env Datei
cd /var/www/betfinder
nano .env
```

Füge folgendes ein (mit deinen Werten):

```env
# Football Data API
FOOTBALL_API_KEY=1a94fa3b84e64785863d830570e62275

# Database Configuration (aus /tmp/betfinder_db_creds.txt)
DB_USER=betfinder
DB_HOST=localhost
DB_NAME=betfinder
DB_PASSWORD=DEIN-GENERIERTES-PASSWORT-HIER
DB_PORT=5432

# JWT Secret (WICHTIG: Ändere diesen zu einem zufälligen String!)
JWT_SECRET=GENERIERE-EINEN-ZUFÄLLIGEN-STRING-HIER

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-DEIN-KEY-HIER

# Server Configuration
PORT=3001
NODE_ENV=production
```

**JWT Secret generieren:**
```bash
# Zufälligen String generieren
openssl rand -base64 32
```

Speichern: `Ctrl + O`, `Enter`, `Ctrl + X`

### 3.3 Backend Dependencies installieren

```bash
cd /var/www/betfinder
npm install
```

### 3.4 Frontend bauen

```bash
cd /var/www/betfinder/frontend
npm install
npm run build
```

Das erstellt einen `build/` Ordner mit der production-ready React App.

---

## 🗄️ Teil 4: Datenbank initialisieren

### 4.1 Datenbank-Schema erstellen

```bash
cd /var/www/betfinder

# Datenbank-Tabellen erstellen
node init-database.js

# User-Tabelle erstellen
node init-users-table.js
```

### 4.2 Daten importieren

**Option A: Schnelles Update (empfohlen für ersten Start)**
```bash
# Nur aktuelle Matches (5-15 Minuten)
node update-data.js recent
```

**Option B: Vollständiger Import (optional, für historische Daten)**
```bash
# Kompletter Datenimport (60-180 Minuten, 2000-5000 API Requests)
node import-all-data.js
```

### 4.3 Logs-Verzeichnis erstellen

```bash
mkdir -p /var/www/betfinder/logs
```

---

## 🚦 Teil 5: Backend mit PM2 starten

### 5.1 Server mit PM2 starten

```bash
cd /var/www/betfinder

# Server starten
pm2 start ecosystem.config.js --env production

# Status prüfen
pm2 status

# Logs anschauen
pm2 logs betfinder

# PM2 bei Reboot automatisch starten
pm2 startup
pm2 save
```

**Nützliche PM2 Befehle:**
```bash
pm2 restart betfinder    # Neustart
pm2 stop betfinder       # Stoppen
pm2 delete betfinder     # Löschen
pm2 logs betfinder       # Logs anschauen
pm2 monit               # Monitoring
```

---

## 🌐 Teil 6: Nginx konfigurieren

### 6.1 Nginx Config erstellen

```bash
# Erstelle Nginx Config
sudo nano /etc/nginx/sites-available/betfinder
```

Füge den Inhalt aus `nginx-config.conf` ein, oder:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name betfinder.cloud www.betfinder.cloud;

    root /var/www/betfinder/frontend/build;
    index index.html;

    client_max_body_size 10M;

    # Serve React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Node.js Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/betfinder_access.log;
    error_log /var/log/nginx/betfinder_error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### 6.2 Nginx aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/betfinder /etc/nginx/sites-enabled/

# Default Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
```

---

## 🔒 Teil 7: SSL Zertifikat (Let's Encrypt)

### 7.1 DNS prüfen

Stelle sicher, dass deine Domain auf die Server-IP zeigt:

```bash
# DNS Check
nslookup betfinder.cloud
dig betfinder.cloud
```

### 7.2 SSL Zertifikat installieren

```bash
# Certbot ausführen (folge den Anweisungen)
sudo certbot --nginx -d betfinder.cloud -d www.betfinder.cloud

# Email eingeben
# Bedingungen akzeptieren
# Wähle Option: 2 (Redirect all HTTP to HTTPS)
```

Certbot wird automatisch:
- ✅ SSL Zertifikat erstellen
- ✅ Nginx Konfiguration anpassen
- ✅ HTTP→HTTPS Redirect einrichten
- ✅ Auto-Renewal konfigurieren

### 7.3 Auto-Renewal testen

```bash
# Test ob Auto-Renewal funktioniert
sudo certbot renew --dry-run
```

---

## ✅ Teil 8: Testing & Verifikation

### 8.1 Backend testen

```bash
# Backend API testen
curl http://localhost:3001/

# Sollte zurückgeben:
# {"message":"Fußball-Analyzer API läuft!","version":"1.0.0"}
```

### 8.2 Frontend testen

Öffne im Browser:
- `https://betfinder.cloud` - Sollte Login-Seite zeigen
- `https://betfinder.cloud/api` - Sollte Backend-Response zeigen

### 8.3 Registrierung testen

1. Gehe zu `https://betfinder.cloud/register`
2. Erstelle einen Test-Account
3. Login und teste Dashboard

### 8.4 Logs prüfen

```bash
# PM2 Logs
pm2 logs betfinder

# Nginx Access Log
sudo tail -f /var/log/nginx/betfinder_access.log

# Nginx Error Log
sudo tail -f /var/log/nginx/betfinder_error.log

# PostgreSQL Logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 🔄 Teil 9: Updates deployen

### 9.1 Code Updates

```bash
cd /var/www/betfinder

# Git Pull
git pull origin main

# Backend Dependencies updaten (falls nötig)
npm install

# Frontend neu bauen
cd frontend
npm install
npm run build
cd ..

# Backend neustarten
pm2 restart betfinder
```

### 9.2 Datenbank Updates

```bash
cd /var/www/betfinder

# Tägliches Update
node update-data.js recent

# Live Updates (während Spieltagen)
node update-data.js live
```

**Automatisierung mit Cron:**
```bash
# Crontab öffnen
crontab -e

# Tägliches Update um 3:00 Uhr
0 3 * * * cd /var/www/betfinder && node update-data.js recent >> logs/update.log 2>&1

# Live Updates Sa/So 14-23 Uhr, alle 15 min
*/15 14-23 * * 6-0 cd /var/www/betfinder && node update-data.js live >> logs/live-update.log 2>&1
```

---

## 🛠️ Troubleshooting

### Problem: "Cannot connect to database"

```bash
# PostgreSQL Status prüfen
sudo systemctl status postgresql

# Neustart
sudo systemctl restart postgresql

# Connection testen
psql -U betfinder -d betfinder -h localhost
```

### Problem: "502 Bad Gateway"

```bash
# PM2 Status prüfen
pm2 status

# Backend neustarten
pm2 restart betfinder

# Logs prüfen
pm2 logs betfinder --lines 100
```

### Problem: "Frontend zeigt 404"

```bash
# Prüfe ob Build-Ordner existiert
ls -la /var/www/betfinder/frontend/build

# Falls nicht: Neu bauen
cd /var/www/betfinder/frontend
npm run build

# Nginx neustarten
sudo systemctl restart nginx
```

### Problem: "API Requests funktionieren nicht"

```bash
# Backend-Logs prüfen
pm2 logs betfinder

# Port 3001 prüfen
sudo netstat -tulpn | grep 3001

# Firewall prüfen
sudo ufw status
```

### Problem: "SSL Zertifikat expired"

```bash
# Manuelles Renewal
sudo certbot renew

# Nginx neustarten
sudo systemctl restart nginx
```

---

## 📊 Monitoring

### System Resources

```bash
# CPU & RAM
htop

# Disk Space
df -h

# PM2 Monitoring
pm2 monit
```

### Application Logs

```bash
# Real-time Logs
pm2 logs betfinder --lines 100

# Error Logs
pm2 logs betfinder --err

# Nginx Logs
sudo tail -f /var/log/nginx/betfinder_error.log
```

---

## 🔐 Sicherheit

### Wichtige Sicherheitsmaßnahmen:

1. **SSH absichern:**
```bash
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no (nach SSH Key Setup)
# PermitRootLogin no
sudo systemctl restart sshd
```

2. **Firewall richtig konfiguriert:**
```bash
sudo ufw status
# Should show: 22/tcp, 80/tcp, 443/tcp ALLOW
```

3. **PostgreSQL nur lokal:**
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = 'localhost'
```

4. **Regelmäßige Updates:**
```bash
sudo apt update && sudo apt upgrade -y
```

5. **Backup-Strategie:**
```bash
# Datenbank Backup
pg_dump -U betfinder betfinder > backup_$(date +%Y%m%d).sql

# Komprimieren
gzip backup_*.sql

# Restore bei Bedarf
gunzip backup_20241102.sql.gz
psql -U betfinder betfinder < backup_20241102.sql
```

---

## 🎉 Fertig!

Deine BetFinder 2.0 App sollte jetzt live sein unter:
- **https://betfinder.cloud**

Bei Problemen, schaue in die Logs:
```bash
pm2 logs betfinder
sudo tail -f /var/log/nginx/betfinder_error.log
```

Viel Erfolg! 🚀
