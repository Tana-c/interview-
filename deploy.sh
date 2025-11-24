#!/bin/bash

# 🚀 Deploy Script for AI Interviewer System
# This script helps prepare files for deployment

echo "🚀 Starting deployment preparation..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
echo -e "${YELLOW}📋 Checking environment files...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo -e "${YELLOW}💡 Creating from .env.example...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env - Please edit it with your API keys!${NC}"
    else
        echo -e "${RED}❌ backend/.env.example not found!${NC}"
    fi
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.production not found${NC}"
    echo -e "${YELLOW}💡 Creating from .env.production.example...${NC}"
    if [ -f "frontend/.env.production.example" ]; then
        cp frontend/.env.production.example frontend/.env.production
        echo -e "${GREEN}✅ Created frontend/.env.production - Please edit it with your API URL!${NC}"
    else
        echo -e "${RED}❌ frontend/.env.production.example not found!${NC}"
    fi
else
    echo -e "${GREEN}✅ frontend/.env.production exists${NC}"
fi

# Build Frontend
echo -e "\n${YELLOW}📦 Building frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing frontend dependencies...${NC}"
    npm install
fi

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful!${NC}"
    echo -e "${GREEN}📁 Build files are in frontend/dist/${NC}"
else
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

cd ..

# Prepare Backend for deployment
echo -e "\n${YELLOW}📦 Preparing backend...${NC}"

# Create backend-prod directory
if [ -d "backend-prod" ]; then
    echo -e "${YELLOW}🗑️  Removing old backend-prod...${NC}"
    rm -rf backend-prod
fi

mkdir -p backend-prod/src
mkdir -p backend-prod/data

# Copy necessary files
echo -e "${YELLOW}📋 Copying backend files...${NC}"
cp -r backend/src/* backend-prod/src/
cp backend/package.json backend-prod/
cp -r backend/data/* backend-prod/data/

# Copy .env if it exists
if [ -f "backend/.env" ]; then
    cp backend/.env backend-prod/.env
    echo -e "${GREEN}✅ Copied .env file${NC}"
else
    echo -e "${RED}⚠️  No .env file found - you'll need to create one on the server${NC}"
fi

echo -e "\n${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo -e "1. Upload ${GREEN}frontend/dist/${NC} to your web hosting (public_html)"
echo -e "2. Upload ${GREEN}backend-prod/${NC} to your Node.js hosting"
echo -e "3. Run ${GREEN}npm install --production${NC} in backend-prod on server"
echo -e "4. Set environment variables on your hosting platform"
echo -e "5. Start your Node.js app"
echo -e "\n${YELLOW}📖 See DEPLOY_GUIDE.md for detailed instructions${NC}"

