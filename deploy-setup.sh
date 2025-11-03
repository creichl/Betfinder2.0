#!/bin/bash

# ==============================================================
# BetFinder 2.0 - Ubuntu 24.04 Deployment Script
# ==============================================================
# Dieses Script installiert alle Dependencies und richtet
# den Server für betfinder.cloud ein
# ==============================================================

set -e  # Stop on errors

echo "🚀 Starting BetFinder 2.0 Deployment Setup"
echo "==========================================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==============================================================
# 1. System Update
# ==============================================================
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# ==============================================================
# 2. Install Node.js 20.x (LTS)
# ==============================================================
echo -e "${BLUE}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo -e "${GREEN}✅ Node version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# ==============================================================
# 3. Install PostgreSQL
# ==============================================================
echo -e "${BLUE}📦 Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo -e "${GREEN}✅ PostgreSQL installed${NC}"

# ==============================================================
# 4. Install Nginx
# ==============================================================
echo -e "${BLUE}📦 Installing Nginx...${NC}"
sudo apt install -y nginx

sudo systemctl start nginx
sudo systemctl enable nginx

echo -e "${GREEN}✅ Nginx installed${NC}"

# ==============================================================
# 5. Install PM2 (Process Manager)
# ==============================================================
echo -e "${BLUE}📦 Installing PM2...${NC}"
sudo npm install -g pm2

echo -e "${GREEN}✅ PM2 installed${NC}"

# ==============================================================
# 6. Install Certbot (SSL/Let's Encrypt)
# ==============================================================
echo -e "${BLUE}📦 Installing Certbot for SSL...${NC}"
sudo apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot installed${NC}"

# ==============================================================
# 7. Install Git
# ==============================================================
echo -e "${BLUE}📦 Installing Git...${NC}"
sudo apt install -y git

echo -e "${GREEN}✅ Git installed${NC}"

# ==============================================================
# 8. Create Application Directory
# ==============================================================
echo -e "${BLUE}📁 Creating application directory...${NC}"
sudo mkdir -p /var/www/betfinder
sudo chown -R $USER:$USER /var/www/betfinder

echo -e "${GREEN}✅ Application directory created at /var/www/betfinder${NC}"

# ==============================================================
# 9. Configure Firewall
# ==============================================================
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo -e "${GREEN}✅ Firewall configured${NC}"

# ==============================================================
# 10. Setup PostgreSQL Database
# ==============================================================
echo -e "${BLUE}🗄️  Setting up PostgreSQL database...${NC}"

# Generate a random password for PostgreSQL
PG_PASSWORD=$(openssl rand -base64 32)

# Create PostgreSQL user and database
sudo -u postgres psql << EOF
-- Create user
CREATE USER betfinder WITH PASSWORD '$PG_PASSWORD';

-- Create database
CREATE DATABASE betfinder OWNER betfinder;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE betfinder TO betfinder;

-- Connect to database and grant schema privileges
\c betfinder
GRANT ALL ON SCHEMA public TO betfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO betfinder;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO betfinder;

\q
EOF

echo -e "${GREEN}✅ PostgreSQL database 'betfinder' created${NC}"
echo -e "${GREEN}   Username: betfinder${NC}"
echo -e "${GREEN}   Password: $PG_PASSWORD${NC}"
echo -e "${RED}   ⚠️  SAVE THIS PASSWORD! You'll need it for .env${NC}"

# Save credentials to a temporary file
echo "DB_USER=betfinder" > /tmp/betfinder_db_creds.txt
echo "DB_PASSWORD=$PG_PASSWORD" >> /tmp/betfinder_db_creds.txt
echo "DB_HOST=localhost" >> /tmp/betfinder_db_creds.txt
echo "DB_NAME=betfinder" >> /tmp/betfinder_db_creds.txt
echo "DB_PORT=5432" >> /tmp/betfinder_db_creds.txt

echo -e "${BLUE}📝 Database credentials saved to /tmp/betfinder_db_creds.txt${NC}"

# ==============================================================
# Summary
# ==============================================================
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Server Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your Git repository to /var/www/betfinder"
echo "2. Copy .env.example to .env and configure it"
echo "3. Install dependencies: npm install"
echo "4. Build frontend: cd frontend && npm install && npm run build"
echo "5. Initialize database: node init-database.js && node init-users-table.js"
echo "6. Import data: node import-all-data.js (or update-data.js)"
echo "7. Start with PM2: pm2 start server.js --name betfinder"
echo "8. Configure Nginx reverse proxy"
echo "9. Setup SSL with: sudo certbot --nginx -d betfinder.cloud -d www.betfinder.cloud"
echo ""
echo -e "${BLUE}Database credentials in: /tmp/betfinder_db_creds.txt${NC}"
echo ""
