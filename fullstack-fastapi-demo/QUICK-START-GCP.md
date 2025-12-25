# Quick Start - Deploy lên GCP

## Tóm tắt các bước

### 1. Tạo VM trên GCP Console
- Compute Engine → Create Instance
- Ubuntu 22.04 LTS, e2-medium
- Enable HTTP + HTTPS traffic
- Tạo Static IP và gán cho VM

### 2. SSH vào VM và setup

```bash
# SSH vào VM (từ GCP Console hoặc gcloud)
gcloud compute ssh fullstack-app-vm --zone=us-central1-a

# Chạy script setup
wget https://raw.githubusercontent.com/your-repo/setup-gcp-vm.sh
chmod +x setup-gcp-vm.sh
./setup-gcp-vm.sh

# Logout và login lại
exit
# SSH lại vào VM
```

### 3. Upload code lên VM

**Option A: Git (Khuyến nghị)**
```bash
cd ~
git clone <your-repo-url> fullstack-fastapi-demo
cd fullstack-fastapi-demo/fullstack-fastapi-demo
```

**Option B: SCP từ local**
```bash
# Từ máy local
gcloud compute scp --recurse ./fullstack-fastapi-demo fullstack-app-vm:~/ --zone=us-central1-a
```

### 4. Cấu hình

```bash
# Tạo file .env
nano .env
# Paste nội dung từ .env.example và cập nhật

# Upload certificate (nếu chưa có)
nano traefik/certs/cloudflare-origin.pem
nano traefik/certs/cloudflare-origin.key
chmod 600 traefik/certs/cloudflare-origin.key
chmod 644 traefik/certs/cloudflare-origin.pem
```

### 5. Deploy

```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

### 6. Cấu hình DNS

1. Cloudflare Dashboard → DNS
2. Sửa A record: `mongoatlasfts.io.vn` → IP của VM
3. SSL/TLS → Full (Strict)

### 7. Test

- `https://mongoatlasfts.io.vn`
- `https://mongoatlasfts.io.vn/docs`

## Troubleshooting

```bash
# Xem logs
docker compose logs -f

# Restart
docker compose restart

# Kiểm tra ports
sudo netstat -tlnp | grep -E ':(80|443)'
```

## Chi phí
- ~$32/tháng (VM e2-medium + storage)

