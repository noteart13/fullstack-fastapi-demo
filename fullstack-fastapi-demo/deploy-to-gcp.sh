#!/bin/bash

# Script để deploy code lên GCP VM
# Sử dụng: ./deploy-to-gcp.sh user@vm-ip

set -e

if [ -z "$1" ]; then
    echo "Usage: ./deploy-to-gcp.sh user@vm-ip"
    echo "Example: ./deploy-to-gcp.sh lehoa@34.123.45.67"
    exit 1
fi

VM_ADDRESS=$1
PROJECT_DIR="~/fullstack-fastapi-demo/fullstack-fastapi-demo"

echo "🚀 Deploying to GCP VM: $VM_ADDRESS"
echo ""

# Copy các file đã sửa lên VM
echo "📦 Copying files to VM..."
scp frontend/app/login/page.tsx $VM_ADDRESS:$PROJECT_DIR/frontend/app/login/page.tsx
scp frontend/app/lib/api/core.ts $VM_ADDRESS:$PROJECT_DIR/frontend/app/lib/api/core.ts
scp frontend/next.config.js $VM_ADDRESS:$PROJECT_DIR/frontend/next.config.js

echo "✅ Files copied successfully!"
echo ""

# SSH vào VM và rebuild
echo "🔨 Rebuilding frontend container..."
ssh $VM_ADDRESS << 'ENDSSH'
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo
echo "Building frontend..."
docker-compose build frontend
echo "Restarting frontend service..."
docker-compose up -d frontend
echo "Checking status..."
docker-compose ps frontend
echo ""
echo "✅ Deployment completed!"
echo "Check logs with: docker-compose logs -f frontend"
ENDSSH

echo ""
echo "🎉 Deployment finished!"
echo "Visit: https://mongoatlasfts.io.vn/login to test"

