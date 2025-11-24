#!/bin/bash

# 🚀 VPS Deploy Script for AI Interviewer System
# Usage: ./deploy-vps.sh user@vps-ip

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: ./deploy-vps.sh user@vps-ip${NC}"
    exit 1
fi

VPS_HOST=$1
VPS_USER=$(echo $VPS_HOST | cut -d@ -f1)
VPS_IP=$(echo $VPS_HOST | cut -d@ -f2)

echo -e "${GREEN}🚀 Starting VPS Deployment...${NC}"
echo -e "${YELLOW}Target: ${VPS_HOST}${NC}"

# Build Frontend
echo -e "\n${YELLOW}📦 Building frontend...${NC}"
cd frontend
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found, creating...${NC}"
    read -p "Enter API URL (e.g., https://api.yourdomain.com): " API_URL
    echo "VITE_API_BASE=${API_URL}" > .env.production
fi

npm install
npm run build
cd ..

# Prepare Backend
echo -e "\n${YELLOW}📦 Preparing backend...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo -e "${YELLOW}Please create backend/.env with:${NC}"
    echo "OPENAI_API_KEY=sk-..."
    echo "PORT=7183"
    echo "NODE_ENV=production"
    exit 1
fi

# Create deployment directory on VPS
echo -e "\n${YELLOW}📁 Creating directories on VPS...${NC}"
ssh $VPS_HOST "mkdir -p ~/interviewer-backend/backend"
ssh $VPS_HOST "sudo mkdir -p /var/www/interviewer/frontend && sudo chown -R $VPS_USER:$VPS_USER /var/www/interviewer"

# Upload Backend
echo -e "\n${YELLOW}📤 Uploading backend...${NC}"
rsync -avz --exclude 'node_modules' backend/ $VPS_HOST:~/interviewer-backend/backend/

# Upload Frontend
echo -e "\n${YELLOW}📤 Uploading frontend...${NC}"
rsync -avz frontend/dist/ $VPS_HOST:/var/www/interviewer/frontend/
scp frontend/.htaccess $VPS_HOST:/var/www/interviewer/frontend/

# Install dependencies and start backend
echo -e "\n${YELLOW}📥 Installing backend dependencies...${NC}"
ssh $VPS_HOST "cd ~/interviewer-backend/backend && npm install --production"

# Start with PM2
echo -e "\n${YELLOW}🚀 Starting backend with PM2...${NC}"
ssh $VPS_HOST "cd ~/interviewer-backend/backend && pm2 delete interviewer-backend 2>/dev/null || true"
ssh $VPS_HOST "cd ~/interviewer-backend/backend && pm2 start src/server.js --name interviewer-backend"
ssh $VPS_HOST "pm2 save"

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Configure Nginx (see VPS_DEPLOY.md)"
echo "2. Set up SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo "3. Test: https://yourdomain.com/aiinterview/"

