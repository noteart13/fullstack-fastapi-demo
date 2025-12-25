#!/bin/bash

# Script deploy lên GCP Compute Engine
# Sử dụng: ./deploy-gcp.sh

set -e

echo "🚀 Bắt đầu deploy lên GCP..."

# Kiểm tra đang ở đúng thư mục
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Lỗi: Không tìm thấy docker-compose.yml"
    echo "Vui lòng chạy script từ thư mục fullstack-fastapi-demo"
    exit 1
fi

# Kiểm tra file .env
if [ ! -f ".env" ]; then
    echo "⚠️  Cảnh báo: Không tìm thấy file .env"
    echo "Tạo file .env từ template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Đã tạo .env từ .env.example"
        echo "⚠️  Vui lòng cập nhật các biến trong .env trước khi tiếp tục"
        exit 1
    else
        echo "❌ Không tìm thấy .env.example"
        exit 1
    fi
fi

# Kiểm tra certificate files
if [ ! -f "traefik/certs/cloudflare-origin.pem" ] || [ ! -f "traefik/certs/cloudflare-origin.key" ]; then
    echo "⚠️  Cảnh báo: Không tìm thấy certificate files"
    echo "Vui lòng tạo certificate trên Cloudflare và lưu vào:"
    echo "  - traefik/certs/cloudflare-origin.pem"
    echo "  - traefik/certs/cloudflare-origin.key"
    exit 1
fi

# Set permissions cho certificate
chmod 600 traefik/certs/cloudflare-origin.key
chmod 644 traefik/certs/cloudflare-origin.pem

echo "✅ Certificate files đã được kiểm tra"

# Pull latest images
echo "📥 Pulling Docker images..."
docker compose pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Đợi services khởi động..."
sleep 10

# Check services status
echo "📊 Checking services status..."
docker compose ps

# Show logs
echo "📋 Recent logs:"
docker compose logs --tail=20

echo ""
echo "✅ Deploy hoàn tất!"
echo ""
echo "Kiểm tra logs:"
echo "  docker compose logs -f"
echo ""
echo "Kiểm tra services:"
echo "  docker compose ps"
echo ""
echo "Test URLs:"
echo "  https://mongoatlasfts.io.vn"
echo "  https://mongoatlasfts.io.vn/docs"

