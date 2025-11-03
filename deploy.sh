  #!/bin/bash
  cd /var/www/betfinder
  echo "🔄 Pulling from GitHub..."
  git pull origin main
  echo "📦 Installing backend dependencies..."
  npm install
  echo "🎨 Building frontend..."
  cd frontend && npm install && npm run build && cd ..
  echo "🔄 Restarting backend..."
  pm2 restart betfinder
  echo "✅ Deployment complete!"
  pm2 logs betfinder --lines 20
  