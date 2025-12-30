# Workflow Fixes - TOTP và Email Validation

## Vấn đề đã phát hiện và sửa

### 1. ✅ Lỗi 400 PUT `/api/v1/login/totp` - TOTP Enable

**Nguyên nhân:**
- Frontend gửi `password: undefined` hoặc empty string khi user có password
- Backend yêu cầu password phải có nếu user đã set password (`hashed_password = True`)

**Đã sửa:**
- `frontend/app/components/settings/Security.tsx`: 
  - Chỉ gửi `password` trong TOTP data nếu user có password
  - Validate password không empty trước khi gửi
  - Throw error rõ ràng nếu thiếu password

**Code thay đổi:**
```typescript
// Chỉ thêm password nếu user có password
if (currentProfile.password) {
  const passwordValue = totpClaim.password || originalPassword;
  if (passwordValue && passwordValue.trim()) {
    totpData.password = passwordValue;
  } else {
    throw new Error("Password is required to enable TOTP");
  }
}
```

### 2. ⚠️ Lỗi 404 POST `/api/v1/users/send-validation-email`

**Nguyên nhân có thể:**
- Backend container chưa được rebuild/restart sau khi thêm endpoint
- Endpoint có trong code nhưng chưa được deploy lên server

**Giải pháp:**

#### Bước 1: Kiểm tra endpoint có trong code
Endpoint đã có trong `backend/app/app/api/api_v1/endpoints/users.py` line 158:
```python
@router.post("/send-validation-email", response_model=schemas.Msg)
async def send_validation_email(...)
```

#### Bước 2: Rebuild và restart backend trên server

**Trên GCP VM:**
```bash
cd ~/fullstack-fastapi-demo
docker-compose down backend
docker-compose build backend
docker-compose up -d backend
```

**Hoặc rebuild toàn bộ:**
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

#### Bước 3: Verify endpoint đã hoạt động

**Kiểm tra trong container:**
```bash
docker-compose exec backend python -c "
from app.api.api_v1.endpoints.users import router
routes = [r.path for r in router.routes if hasattr(r, 'path')]
print('Available routes:')
for r in sorted(set(routes)):
    print(f'  {r}')
"
```

**Hoặc test trực tiếp:**
```bash
# Lấy access token từ login
curl -X POST https://mongoatlasfts.io.vn/api/v1/users/send-validation-email \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Checklist sau khi sửa

- [ ] Rebuild backend container trên server
- [ ] Restart backend service
- [ ] Test enable TOTP với user có password → phải thành công
- [ ] Test enable TOTP với user không có password → phải thành công
- [ ] Test send validation email → không còn 404
- [ ] Verify email được gửi (nếu SMTP đã config)

## Lưu ý

1. **TOTP Enable:**
   - User có password → PHẢI nhập password để enable TOTP
   - User không có password → có thể enable TOTP mà không cần password

2. **Email Validation:**
   - Endpoint yêu cầu authentication (`current_user`)
   - Chỉ gửi email nếu `EMAILS_ENABLED=True` trong `.env`
   - Email link sẽ point đến `/settings?token=...`

