#!/bin/bash

set -e

echo "========================================"
echo "🚀 AgenticRAG Deployment Started"
echo "========================================"

APP_DIR="/opt/chatbot_cass/app"

cd $APP_DIR

echo ""
echo "📥 Pulling latest code..."
git pull origin main

#########################################
# Backend
#########################################

echo ""
echo "🐍 Backend"

source /opt/chatbot_cass/venv/bin/activate

pip install -r backend/requirements.txt

#########################################
# Frontend
#########################################

echo ""
echo "⚛️ Frontend"

cd frontend

npm ci

npm run build

#########################################
# Restart Services
#########################################

echo ""
echo "🔄 Restarting Services"

sudo systemctl restart chatbot-cass
sudo systemctl restart agenticrag-frontend

#########################################
# Health Checks
#########################################

echo ""
echo "❤️ Health Checks"

curl --fail http://127.0.0.1:8000/health

curl --fail http://127.0.0.1:3000 > /dev/null

echo ""
echo "✅ Deployment Successful!"