# Hướng dẫn cấu hình Cloudflare Origin Certificate

## Bước 1: Tạo Origin Certificate trên Cloudflare

1. Đăng nhập vào Cloudflare Dashboard
2. Chọn domain `mongoatlasfts.io.vn`
3. Vào **SSL/TLS** → **Origin Server** → **Create Certificate**
4. Cấu hình:
   - **Hostnames**: `mongoatlasfts.io.vn` và `*.mongoatlasfts.io.vn`
   - **Validity**: 15 years
   - Click **Create**
5. Copy 2 phần:
   - **Origin Certificate** (PEM format)
   - **Private Key**

## Bước 2: Lưu Certificate vào server

### Trên Windows (local development):

1. **Đảm bảo Docker Desktop đang chạy** (mở Docker Desktop app)
2. Mở file `traefik/certs/cloudflare-origin.pem` và dán **Origin Certificate** vào
3. Mở file `traefik/certs/cloudflare-origin.key` và dán **Private Key** vào
4. Lưu cả 2 file
5. **KHÔNG cần chạy `chmod`** (đây là lệnh Linux, không dùng trên Windows)

### Trên Linux VPS (production):

```bash
# Tạo thư mục
sudo mkdir -p /opt/traefik/certs
sudo mkdir -p /opt/traefik/dynamic

# Lưu Origin Certificate
sudo nano /opt/traefik/certs/cloudflare-origin.pem
# Dán Origin Certificate → Save (Ctrl+O, Enter, Ctrl+X)

# Lưu Private Key
sudo nano /opt/traefik/certs/cloudflare-origin.key
# Dán Private Key → Save

# Set permissions
sudo chmod 600 /opt/traefik/certs/cloudflare-origin.key
sudo chmod 644 /opt/traefik/certs/cloudflare-origin.pem
```

## Bước 3: Cấu hình Traefik

File `docker-compose.yml` và `docker-compose.override.yml` đã được cấu hình sẵn để:
- Mount thư mục `traefik/certs` vào container
- Mount thư mục `traefik/dynamic` để đọc file `tls.yml`
- Bật entrypoints HTTP (80) và HTTPS (443)
- Sử dụng Cloudflare Origin Certificate

## Bước 4: Restart Traefik

```bash
docker compose down
docker compose up -d
```

Kiểm tra logs:
```bash
docker logs -f proxy
```

## Bước 5: Cấu hình Cloudflare SSL/TLS Mode

1. Vào Cloudflare Dashboard
2. **SSL/TLS** → **Overview**
3. Chọn **Full (Strict)** ✅

## Bước 6: Kiểm tra DNS

Đảm bảo DNS record đang **Proxied** (mây cam 🟠):
- `mongoatlasfts.io.vn` → Proxied
- `*.mongoatlasfts.io.vn` → Proxied (nếu có)

## Bước 7: Test

- https://mongoatlasfts.io.vn
- https://mongoatlasfts.io.vn/docs
- https://mongoatlasfts.io.vn/api/v1/health

## Troubleshooting

### Lỗi: "failed to load TLS key"
- Kiểm tra file cert và key đã được paste đúng chưa
- Kiểm tra permissions (trên Linux: `chmod 600` cho key, `chmod 644` cho cert)

### Lỗi: "certificate not found"
- Kiểm tra đường dẫn mount trong docker-compose.yml
- Kiểm tra file `traefik/dynamic/tls.yml` có đúng format không

### Vẫn không HTTPS
- Kiểm tra port 443 đã được map chưa (trong docker-compose.override.yml)
- Kiểm tra Cloudflare SSL/TLS mode đã set **Full (Strict)** chưa
- Kiểm tra DNS record đang **Proxied** chưa


