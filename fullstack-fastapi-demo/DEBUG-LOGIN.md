# Debug Login Issues

## Kiểm tra các vấn đề có thể xảy ra:

### 1. Kiểm tra API URL trong Frontend

Frontend cần biết đúng URL của backend API. Kiểm tra trong `.env`:

```bash
cat .env | grep NEXT_PUBLIC_API_URL
```

**Phải là:** `NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1`

**Lưu ý:** Sau khi sửa `.env`, phải rebuild frontend:
```bash
docker compose build frontend
docker compose up -d frontend
```

### 2. Kiểm tra Credentials trong .env

Kiểm tra dòng 23-24 trong `.env`:
```bash
cat .env | grep -A 1 FIRST_SUPERUSER
```

**Phải có:**
- `FIRST_SUPERUSER=admin@fullstack-fastapi-demo.com` (hoặc email khác)
- `FIRST_SUPERUSER_PASSWORD=changethis` (hoặc password khác)

### 3. Kiểm tra User đã được tạo trong Database chưa

Backend tự động tạo user khi khởi động lần đầu. Kiểm tra logs:
```bash
docker compose logs backend | grep -i "first superuser\|init_db"
```

### 4. Test Login Endpoint trực tiếp

Test từ VM để xác định vấn đề:

```bash
# Thay EMAIL và PASSWORD bằng giá trị từ .env
curl -X POST https://mongoatlasfts.io.vn/api/v1/login/oauth \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@fullstack-fastapi-demo.com" \
  -d "password=changethis" \
  -d "grant_type=password"
```

**Nếu thành công:** Sẽ trả về JSON với `access_token` và `refresh_token`
**Nếu thất bại:** Sẽ trả về `{"detail":"Login failed; incorrect email or password"}`

### 5. Kiểm tra CORS Configuration

Kiểm tra `BACKEND_CORS_ORIGINS` trong `.env`:
```bash
cat .env | grep BACKEND_CORS_ORIGINS
```

**Phải bao gồm:** `https://mongoatlasfts.io.vn`

### 6. Kiểm tra Browser Console

Mở Developer Tools (F12) trong browser và kiểm tra:
- **Console tab:** Xem có lỗi JavaScript không
- **Network tab:** Xem request đến `/api/v1/login/oauth` có thành công không
  - Status code phải là 200
  - Response phải có `access_token`

### 7. Kiểm tra Backend Logs

Xem logs backend khi đăng nhập:
```bash
docker compose logs backend --tail=50 -f
```

### 8. Reset Password nếu cần

Nếu user đã tồn tại nhưng password không đúng, có thể reset:

```bash
# Vào container backend
docker compose exec backend python -c "
from app.db.init_db import init_db
from app.core.database import connect_to_mongo
import asyncio

async def reset():
    db = await connect_to_mongo()
    await init_db(db)
    print('Database initialized')

asyncio.run(reset())
"
```

## Các lỗi thường gặp:

### Lỗi: "Login failed; incorrect email or password"
- **Nguyên nhân:** Email hoặc password không đúng
- **Giải pháp:** Kiểm tra lại `FIRST_SUPERUSER` và `FIRST_SUPERUSER_PASSWORD` trong `.env`

### Lỗi: CORS error trong browser
- **Nguyên nhân:** `BACKEND_CORS_ORIGINS` không bao gồm frontend domain
- **Giải pháp:** Thêm `https://mongoatlasfts.io.vn` vào `BACKEND_CORS_ORIGINS`

### Lỗi: Network error / Connection refused
- **Nguyên nhân:** API URL không đúng hoặc backend không chạy
- **Giải pháp:** 
  - Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env`
  - Rebuild frontend sau khi sửa `.env`
  - Kiểm tra backend đang chạy: `docker compose ps backend`

### Lỗi: 404 Not Found khi gọi API
- **Nguyên nhân:** API URL thiếu `/api/v1` hoặc sai path
- **Giải pháp:** Đảm bảo `NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1`


