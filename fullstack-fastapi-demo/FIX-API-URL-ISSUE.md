# Fix API URL Issue - ERR_CONNECTION_REFUSED

## 🔴 Vấn đề:

Frontend đang gọi API đến `http://localhost/api/v1/login/oauth` thay vì `https://mongoatlasfts.io.vn/api/v1/login/oauth`

**Lỗi:** `POST http://localhost/api/v1/login/oauth net::ERR_CONNECTION_REFUSED`

## 🔍 Nguyên nhân:

Next.js cần biến môi trường `NEXT_PUBLIC_*` tại **BUILD TIME**, không phải runtime. Hiện tại:
- Dockerfile chưa nhận `NEXT_PUBLIC_API_URL` như build argument
- docker-compose.yml chưa truyền build args

## ✅ Giải pháp:

### Bước 1: Sửa Dockerfile

File: `frontend/Dockerfile`

Thêm vào phần builder (trước `RUN npm run build`):

```dockerfile
# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

### Bước 2: Sửa docker-compose.yml

File: `docker-compose.yml`

Thêm `args` vào phần `build` của frontend:

```yaml
frontend:
  build:
    context: ./frontend
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://mongoatlasfts.io.vn/api/v1}
```

### Bước 3: Đảm bảo .env có NEXT_PUBLIC_API_URL

```bash
# Trên VM
cd ~/fullstack-fastapi-demo/fullstack-fastapi-demo

# Kiểm tra
grep NEXT_PUBLIC_API_URL .env

# Nếu không có, thêm:
echo "NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1" >> .env
```

### Bước 4: Rebuild Frontend

```bash
# Rebuild với build args mới
docker-compose build --no-cache frontend

# Restart
docker-compose up -d frontend

# Đợi 30 giây
sleep 30

# Kiểm tra logs
docker-compose logs frontend --tail=30
```

### Bước 5: Clear Browser Cache

1. **Hard refresh**: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
2. Hoặc **Clear cache**: `Ctrl+Shift+Delete` → Clear cached images and files

### Bước 6: Test lại

1. Mở https://mongoatlasfts.io.vn/login
2. Mở DevTools (F12) → **Network** tab
3. Thử đăng nhập
4. Kiểm tra request phải đi đến:
   - ✅ `https://mongoatlasfts.io.vn/api/v1/login/oauth`
   - ❌ KHÔNG phải `http://localhost/api/v1/login/oauth`

## 📋 Checklist:

- [ ] Dockerfile đã có `ARG NEXT_PUBLIC_API_URL`
- [ ] docker-compose.yml đã có `build.args`
- [ ] .env có `NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1`
- [ ] Frontend đã được rebuild
- [ ] Browser cache đã được clear
- [ ] Request đi đến đúng URL

## 🐛 Nếu vẫn lỗi:

### Kiểm tra build args có được truyền không:

```bash
# Xem build logs
docker-compose build frontend 2>&1 | grep -i "NEXT_PUBLIC_API_URL"
```

### Kiểm tra trong container:

```bash
# Vào container
docker-compose exec frontend sh

# Kiểm tra biến môi trường (sẽ không có vì Next.js embed vào build)
# Nhưng có thể check build output
cat .next/standalone/.env.local 2>/dev/null || echo "No .env.local"
```

### Kiểm tra code đã được build đúng chưa:

```bash
# Extract và check built code
docker-compose exec frontend cat .next/standalone/frontend/app/lib/api/core.js | grep -i "api_url"
```

## 🎯 Kết quả mong đợi:

Sau khi fix:
- ✅ Frontend gọi API đến `https://mongoatlasfts.io.vn/api/v1/login/oauth`
- ✅ Không còn lỗi `ERR_CONNECTION_REFUSED`
- ✅ Login hoạt động thành công

