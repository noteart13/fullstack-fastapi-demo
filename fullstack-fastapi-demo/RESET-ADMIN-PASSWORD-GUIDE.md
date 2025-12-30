# Hướng Dẫn Reset Password Admin

## Vấn đề với câu lệnh cũ

Câu lệnh bạn dùng có các vấn đề:
1. **Syntax error**: `asyncio.run(reset_admin())` được đặt bên trong function → sai
2. **Indentation sai**: Code bị lỗi indentation
3. **Thiếu error handling**: Không có try-catch và debug info

## Giải pháp: Script mới

Đã tạo script `backend/app/reset_admin_password.py` với các tính năng:
- ✅ Syntax đúng
- ✅ Error handling đầy đủ
- ✅ Hiển thị danh sách users nếu không tìm thấy
- ✅ Hỗ trợ nhiều cách sử dụng

## Cách sử dụng

### Cách 1: Chỉ định email và password (Khuyến nghị)

```bash
docker exec -it $(docker ps -qf "name=backend") python /app/reset_admin_password.py admin@mongoatlasfts.io.vn newpassword123
```

### Cách 2: Chỉ định password (dùng FIRST_SUPERUSER từ .env)

```bash
docker exec -it $(docker ps -qf "name=backend") python /app/reset_admin_password.py newpassword123
```

### Cách 3: Copy script vào container và chạy

Nếu script chưa có trong container:

```bash
# Copy script vào container
docker cp backend/app/reset_admin_password.py $(docker ps -qf "name=backend"):/app/reset_admin_password.py

# Chạy script
docker exec -it $(docker ps -qf "name=backend") python /app/reset_admin_password.py admin@mongoatlasfts.io.vn newpassword123
```

## Rebuild backend để script có sẵn trong container

```bash
cd ~/fullstack-fastapi-demo
docker-compose build backend
docker-compose up -d backend
```

## Ví dụ output

**Thành công:**
```
🔍 Looking for user: admin@mongoatlasfts.io.vn
✅ Found user: admin@mongoatlasfts.io.vn
   - ID: 694cc42edfeacf98167e5346
   - Superuser: True
   - Active: True

✅ SUCCESS: Password updated for admin@mongoatlasfts.io.vn
   New password: newpassword123
```

**Không tìm thấy user:**
```
🔍 Looking for user: admin@mongoatlasfts.io.vn
❌ ERROR: User 'admin@mongoatlasfts.io.vn' not found!

📋 Available users:
  - user1@example.com (superuser: False, active: True)
  - admin@mongoatlasfts.io.vn (superuser: True, active: True)
```

## Troubleshooting

### Lỗi: "Module not found"
```bash
# Đảm bảo đang chạy trong container backend
docker exec -it $(docker ps -qf "name=backend") python /app/reset_admin_password.py admin@mongoatlasfts.io.vn newpassword123
```

### Lỗi: "File not found"
```bash
# Copy script vào container
docker cp backend/app/reset_admin_password.py $(docker ps -qf "name=backend"):/app/reset_admin_password.py
```

### Lỗi: "Database connection failed"
- Kiểm tra MongoDB đang chạy: `docker-compose ps mongodb`
- Kiểm tra `.env` có `MONGO_DATABASE_URI` đúng không

## So sánh với script cũ

**Script cũ (SAI):**
```python
async def reset_admin():
    # ... code ...
    asyncio.run(reset_admin())  # ❌ SAI: Đặt bên trong function
```

**Script mới (ĐÚNG):**
```python
async def reset_admin_password(email, new_password):
    # ... code ...
    
if __name__ == "__main__":
    asyncio.run(main())  # ✅ ĐÚNG: Đặt ở ngoài
```

