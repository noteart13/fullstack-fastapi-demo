#!/bin/bash

# Script setup VM trên GCP
# Chạy script này trên VM sau khi SSH vào

set -e

echo "🔧 Bắt đầu setup VM..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Verify installations
echo "🔍 Verifying installations..."
docker --version
docker-compose --version

echo ""
echo "✅ Setup hoàn tất!"
echo ""
echo "⚠️  QUAN TRỌNG: Logout và login lại để áp dụng Docker group changes:"
echo "   exit"
echo "   # SSH lại vào VM"
echo ""
echo "Sau đó, upload code và chạy:"
echo "   cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo"
echo "   ./deploy-gcp.sh"

