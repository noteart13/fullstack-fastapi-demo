# Hướng dẫn Deploy lên Google Cloud Platform (GCP)

## Tổng quan

Hướng dẫn này sẽ giúp bạn deploy ứng dụng lên GCP Compute Engine (VM) sử dụng Docker Compose.

## Bước 1: Tạo VM Instance trên GCP

### 1.1. Tạo VM Instance

1. Vào [GCP Console](https://console.cloud.google.com/)
2. Chọn **Compute Engine** → **VM instances**
3. Click **Create Instance**
4. Cấu hình:
   - **Name**: `fullstack-app-vm`
   - **Region**: `us-central1` (hoặc region gần bạn)
   - **Machine type**: `e2-medium` (2 vCPU, 4GB RAM) - tối thiểu
   - **Boot disk**: 
     - OS: **Ubuntu 22.04 LTS**
     - Size: **20GB** (tối thiểu)
   - **Firewall**: 
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic
   - Click **Create**

### 1.2. Tạo Static IP

1. Vào **VPC network** → **IP addresses**
2. Click **Reserve external static IP address**
3. Cấu hình:
   - **Name**: `app-static-ip`
   - **Region**: Chọn cùng region với VM
   - Click **Reserve**
4. Ghi nhớ IP address (ví dụ: `34.123.45.67`)

### 1.3. Gán Static IP cho VM

1. Vào **VM instances**
2. Click vào VM instance
3. Click **Edit**
4. Trong **Network interfaces**, chọn **External IP** → **Reserve a new static IP address** hoặc chọn IP đã tạo
5. Click **Save**

## Bước 2: Kết nối và Setup VM

### 2.1. SSH vào VM

```bash
# Từ GCP Console, click "SSH" button
# Hoặc từ local:
gcloud compute ssh fullstack-app-vm --zone=us-central1-a
```

### 2.2. Cài đặt Docker và Docker Compose

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout và login lại để áp dụng group changes
exit
# SSH lại vào VM
```

### 2.3. Cài đặt Git

```bash
sudo apt-get install -y git
```

## Bước 3: Upload Code lên VM

### Option A: Sử dụng Git (Khuyến nghị)

```bash
# Trên VM
cd ~
git clone <your-repo-url> fullstack-fastapi-demo
cd fullstack-fastapi-demo/fullstack-fastapi-demo
```

### Option B: Sử dụng gcloud scp

```bash
# Từ máy local
gcloud compute scp --recurse ./fullstack-fastapi-demo fullstack-app-vm:~/ --zone=us-central1-a
```

### Option C: Sử dụng Cloud Storage

```bash
# Từ máy local - tạo archive
cd fullstack-fastapi-demo
tar -czf ../app.tar.gz .

# Upload lên Cloud Storage
gsutil cp ../app.tar.gz gs://your-bucket/

# Trên VM - download
gsutil cp gs://your-bucket/app.tar.gz ~/
tar -xzf app.tar.gz
```

## Bước 4: Cấu hình Environment Variables

```bash
# Trên VM
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo

# Tạo file .env từ template
cp .env.example .env  # Nếu có
# Hoặc tạo mới
nano .env
```

Cấu hình các biến quan trọng:

```env
# Domain
DOMAIN=mongoatlasfts.io.vn
STACK_NAME=fullstack-fastapi-demo-com
TRAEFIK_TAG=fullstack-fastapi-demo-com
TRAEFIK_PUBLIC_NETWORK=traefik-public
TRAEFIK_PUBLIC_TAG=traefik-public

# Database (nếu dùng MongoDB Atlas)
MONGODB_URL=mongodb+srv://...

# Email
EMAILS_FROM_EMAIL=noreply@mongoatlasfts.io.vn
EMAILS_TO_EMAIL=admin@mongoatlasfts.io.vn
SMTP_TLS=True
SMTP_SSL=False
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security
SECRET_KEY=your-secret-key-here
FIRST_SUPERUSER=admin@mongoatlasfts.io.vn
FIRST_SUPERUSER_PASSWORD=your-password

# Server
SERVER_NAME=mongoatlasfts.io.vn
SERVER_HOST=https://mongoatlasfts.io.vn
BACKEND_CORS_ORIGINS=["https://mongoatlasfts.io.vn"]
NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn
```

## Bước 5: Cấu hình Cloudflare Certificate

```bash
# Trên VM
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo

# Tạo thư mục certs nếu chưa có
mkdir -p traefik/certs

# Upload certificate files (từ máy local)
# Sử dụng gcloud scp hoặc nano để paste certificate
nano traefik/certs/cloudflare-origin.pem
# Paste Origin Certificate từ Cloudflare

nano traefik/certs/cloudflare-origin.key
# Paste Private Key từ Cloudflare

# Set permissions
chmod 600 traefik/certs/cloudflare-origin.key
chmod 644 traefik/certs/cloudflare-origin.pem
```

## Bước 6: Cấu hình Docker Compose cho Production

File `docker-compose.yml` đã được cấu hình sẵn. Chỉ cần đảm bảo:
- Port 80 và 443 được expose
- Certificate được mount đúng
- Environment variables đã set

## Bước 7: Deploy

```bash
# Trên VM
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo

# Pull images (nếu cần)
docker compose pull

# Start services
docker compose up -d

# Kiểm tra logs
docker compose logs -f

# Kiểm tra containers
docker compose ps
```

## Bước 8: Cấu hình DNS và Cloudflare

### 8.1. Cập nhật DNS Record

1. Vào Cloudflare Dashboard → **DNS**
2. Sửa A record `mongoatlasfts.io.vn`:
   - **Content**: IP của VM (Static IP đã tạo)
   - **Proxy status**: **Proxied** (mây cam)
3. Save

### 8.2. Cấu hình Cloudflare SSL/TLS

1. Vào **SSL/TLS** → **Overview**
2. Chọn **Full (Strict)**
3. Save

## Bước 9: Kiểm tra Firewall Rules

```bash
# Trên GCP Console
# Vào VPC network → Firewall rules
# Đảm bảo có rules:
# - allow-http: Port 80, Source: 0.0.0.0/0
# - allow-https: Port 443, Source: 0.0.0.0/0
```

Hoặc tạo bằng gcloud:

```bash
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server
```

## Bước 10: Test

Sau khi deploy xong, test các URL:

- `https://mongoatlasfts.io.vn`
- `https://mongoatlasfts.io.vn/docs`
- `https://mongoatlasfts.io.vn/api/v1/health`

## Troubleshooting

### Kiểm tra logs

```bash
# Traefik logs
docker compose logs proxy

# Backend logs
docker compose logs backend

# Frontend logs
docker compose logs frontend
```

### Kiểm tra ports

```bash
# Trên VM
sudo netstat -tlnp | grep -E ':(80|443)'
```

### Restart services

```bash
docker compose restart
# Hoặc
docker compose down
docker compose up -d
```

### Kiểm tra certificate

```bash
# Trên VM
docker exec fullstack-fastapi-demo-proxy-1 ls -la /certs/
docker exec fullstack-fastapi-demo-proxy-1 cat /dynamic/tls.yml
```

## Chi phí ước tính

- **VM e2-medium**: ~$30/tháng
- **Static IP**: Miễn phí nếu đang sử dụng
- **Storage**: ~$2/tháng (20GB)
- **Tổng**: ~$32/tháng

## Lưu ý

1. Đảm bảo backup database thường xuyên
2. Monitor logs để phát hiện lỗi sớm
3. Cập nhật security patches định kỳ
4. Sử dụng MongoDB Atlas cho production (không dùng MongoDB local)

