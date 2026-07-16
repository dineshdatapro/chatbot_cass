#!/bin/bash

set -e

echo "========================================"
echo "🚀 AgenticRAG Deployment Started"
echo "========================================"

APP_DIR="/opt/chatbot_cass/app"

cd $APP_DIR

# echo ""
# echo "📥 Pulling latest code..."
# git pull origin main

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

npm install

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
echo "❤️ Waiting for Backend..."

for i in {1..30}; do
    if curl -fs http://127.0.0.1:8000/health >/dev/null; then
        echo "✅ Backend Ready"
        break
    fi

    echo "Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "❤️ Checking Backend"

curl --fail http://127.0.0.1:8000/health

echo ""
echo "❤️ Checking Frontend"

for i in {1..30}; do
    if curl -fs http://127.0.0.1:3000 >/dev/null; then
        echo "✅ Frontend Ready"
        break
    fi

    echo "Waiting... ($i/30)"
    sleep 2
done

curl --fail http://127.0.0.1:3000 >/dev/null

echo ""
echo "========================================"
echo "✅ Deployment Successful!"
echo "========================================"