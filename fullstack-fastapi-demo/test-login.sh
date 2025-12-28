#!/bin/bash

# Script để test login endpoint
# Usage: ./test-login.sh [email] [password]

echo "=== Test Login Endpoint ==="
echo ""

# Đọc credentials từ .env nếu không có arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    if [ -f .env ]; then
        EMAIL=$(grep "^FIRST_SUPERUSER=" .env | cut -d '=' -f2)
        PASSWORD=$(grep "^FIRST_SUPERUSER_PASSWORD=" .env | cut -d '=' -f2)
        echo "Using credentials from .env:"
        echo "  Email: $EMAIL"
        echo "  Password: [hidden]"
        echo ""
    else
        echo "Error: .env file not found"
        echo "Usage: $0 [email] [password]"
        exit 1
    fi
else
    EMAIL="$1"
    PASSWORD="$2"
    echo "Using provided credentials:"
    echo "  Email: $EMAIL"
    echo "  Password: [hidden]"
    echo ""
fi

# Kiểm tra API URL
API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env 2>/dev/null | cut -d '=' -f2)
if [ -z "$API_URL" ]; then
    API_URL="https://mongoatlasfts.io.vn/api/v1"
    echo "Warning: NEXT_PUBLIC_API_URL not found in .env, using default: $API_URL"
else
    echo "API URL: $API_URL"
fi
echo ""

# Test login endpoint
echo "Testing login endpoint..."
echo "POST $API_URL/login/oauth"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/login/oauth" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL" \
  -d "password=$PASSWORD" \
  -d "grant_type=password")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d ':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login successful!"
    if echo "$BODY" | grep -q "access_token"; then
        echo "✅ Access token received"
    fi
else
    echo "❌ Login failed"
    echo ""
    echo "Possible issues:"
    echo "1. Check email and password in .env"
    echo "2. Check if user exists in database"
    echo "3. Check backend logs: docker compose logs backend --tail=50"
    echo "4. Check CORS configuration: docker compose logs backend | grep -i cors"
fi


