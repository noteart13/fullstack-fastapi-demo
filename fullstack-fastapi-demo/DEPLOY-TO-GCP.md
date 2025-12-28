# Hướng dẫn Deploy lên GCP VM

## Các thay đổi đã thực hiện:
1. ✅ Login page mặc định sử dụng password (OAuth) thay vì magic link
2. ✅ Cải thiện cấu hình API URL với fallback
3. ✅ Cập nhật Next.js config cho routing tốt hơn

## Cách 1: Deploy trực tiếp trên GCP VM (Khuyến nghị)

### Bước 1: Commit và push code lên Git (từ máy local)
```bash
# Commit các thay đổi
git add frontend/app/login/page.tsx frontend/app/lib/api/core.ts frontend/next.config.js
git commit -m "Fix: Set password login as default and improve API URL configuration"
git push origin main
```

### Bước 2: SSH vào GCP VM và pull code mới
```bash
# SSH vào VM
ssh your-user@your-vm-ip

# Di chuyển vào thư mục project
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo

# Pull code mới nhất
git pull origin main
```

### Bước 3: Rebuild và restart containers
```bash
# Rebuild frontend với code mới
docker-compose build frontend

# Restart services
docker-compose up -d

# Kiểm tra logs để đảm bảo không có lỗi
docker-compose logs -f frontend
```

## Cách 2: Copy file trực tiếp lên VM (Nhanh hơn, không cần Git)

### Bước 1: Từ máy local, copy các file đã sửa lên VM
```bash
# Sử dụng SCP để copy file
scp frontend/app/login/page.tsx your-user@your-vm-ip:~/fullstack-fastapi-demo/fullstack-fastapi-demo/frontend/app/login/page.tsx
scp frontend/app/lib/api/core.ts your-user@your-vm-ip:~/fullstack-fastapi-demo/fullstack-fastapi-demo/frontend/app/lib/api/core.ts
scp frontend/next.config.js your-user@your-vm-ip:~/fullstack-fastapi-demo/fullstack-fastapi-demo/frontend/next.config.js
```

### Bước 2: SSH vào VM và rebuild
```bash
ssh your-user@your-vm-ip
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo
docker-compose build frontend
docker-compose up -d frontend
```

## Kiểm tra sau khi deploy

1. Truy cập: https://mongoatlasfts.io.vn/login
2. Kiểm tra xem trang login có hiển thị trường password mặc định không
3. Thử đăng nhập với:
   - Email: admin@mongoatlasfts.io.vn
   - Password: your-password

## Troubleshooting

Nếu gặp lỗi, kiểm tra:
```bash
# Xem logs của frontend
docker-compose logs frontend

# Xem logs của backend
docker-compose logs backend

# Kiểm tra containers đang chạy
docker-compose ps

# Restart toàn bộ stack nếu cần
docker-compose down
docker-compose up -d
```

