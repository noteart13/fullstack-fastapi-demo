# 🔧 GCP VM Qdrant Dashboard Access Fix

## 🚨 Problem Identified

- ✅ **Local access works**: `http://localhost:6333/dashboard#/collections`
- ❌ **Public access fails**: `https://mongoatlasfts.io.vn/qdrant/dashboard#/collections` → 404 Error

**Root Cause**: Traefik routing configuration issue - the `/qdrant` path is not properly routing to Qdrant service.

## 🔍 Current Status

From your screenshots:
- **Qdrant is running correctly** (localhost works)
- **Data is properly synced** (5 users visible)
- **Traefik routing is broken** (public URL returns 404)

## 🛠️ Solutions

### Solution 1: Fix Traefik Routing (Recommended)

#### Step 1: Check Current Traefik Configuration

```bash
# SSH into your GCP VM
ssh your-vm-name

# Check if Traefik is running
docker-compose ps | grep proxy

# Check Traefik logs for routing errors
docker-compose logs proxy | grep -i qdrant
```

#### Step 2: Verify Qdrant Service Labels

Check if Qdrant service has correct Traefik labels:

```bash
# Check Qdrant container labels
docker inspect fullstack-fastapi-demo-qdrant-1 | grep -A 20 "Labels"
```

#### Step 3: Fix Docker Compose Configuration

The issue is likely in the Traefik labels. Update your `docker-compose.yml`:

```yaml
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - "6333:6333"
  volumes:
    - qdrant_data:/qdrant/storage
  networks:
    - traefik-public
    - default
  labels:
    - traefik.enable=true
    - traefik.docker.network=${TRAEFIK_PUBLIC_NETWORK?Variable not set}
    - traefik.constraint-label-stack=${TRAEFIK_TAG?Variable not set}
    # HTTP router (redirects to HTTPS)
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-http.rule=Host(`${DOMAIN?Variable not set}`) && PathPrefix(`/qdrant`)
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-http.entrypoints=web
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-http.middlewares=${STACK_NAME?Variable not set}-https-redirect,${STACK_NAME?Variable not set}-qdrant-stripprefix
    # HTTPS router (main access)
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-https.rule=Host(`${DOMAIN?Variable not set}`) && PathPrefix(`/qdrant`)
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-https.entrypoints=websecure
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-https.tls=true
    - traefik.http.routers.${STACK_NAME?Variable not set}-qdrant-https.middlewares=${STACK_NAME?Variable not set}-qdrant-stripprefix
    # Service configuration
    - traefik.http.services.${STACK_NAME?Variable not set}-qdrant.loadbalancer.server.port=6333
    # Strip /qdrant prefix before forwarding to Qdrant
    - traefik.http.middlewares.${STACK_NAME?Variable not set}-qdrant-stripprefix.stripprefix.prefixes=/qdrant
```

#### Step 4: Restart Services

```bash
# Restart Qdrant and Traefik
docker-compose down qdrant proxy
docker-compose up -d qdrant proxy

# Wait 30 seconds for services to start
sleep 30

# Check if services are running
docker-compose ps
```

#### Step 5: Test the Fix

```bash
# Test API endpoint
curl -k https://mongoatlasfts.io.vn/qdrant/collections

# If successful, try dashboard
# Open: https://mongoatlasfts.io.vn/qdrant/dashboard#/collections
```

### Solution 2: Alternative Access Methods

If Traefik fix doesn't work immediately, use these alternatives:

#### Option A: SSH Tunnel (Secure)

```bash
# From your local machine, create SSH tunnel
ssh -L 6333:localhost:6333 your-gcp-vm-user@your-vm-external-ip

# Then access locally
# http://localhost:6333/dashboard#/collections
```

#### Option B: Direct Port Access (Less Secure)

```bash
# On GCP VM, allow port 6333 through firewall
gcloud compute firewall-rules create allow-qdrant-direct \
    --allow tcp:6333 \
    --source-ranges 0.0.0.0/0 \
    --description "Direct Qdrant access"

# Then access via VM external IP
# http://YOUR-VM-EXTERNAL-IP:6333/dashboard#/collections
```

### Solution 3: Debug Traefik Routing

#### Check Traefik Dashboard

```bash
# Access Traefik dashboard (if enabled)
# http://YOUR-VM-EXTERNAL-IP:8090

# Look for Qdrant service in the dashboard
# Check if routing rules are properly configured
```

#### Check Traefik Logs

```bash
# Check for routing errors
docker-compose logs proxy | grep -E "(qdrant|error|404)"

# Check if Qdrant service is discovered
docker-compose logs proxy | grep -i "service.*qdrant"
```

## 🔧 Quick Fix Commands

Run these commands on your GCP VM:

```bash
# 1. Check current status
echo "=== Checking Services ==="
docker-compose ps

# 2. Check Traefik logs for Qdrant
echo "=== Traefik Logs ==="
docker-compose logs proxy --tail 50 | grep -i qdrant

# 3. Restart services
echo "=== Restarting Services ==="
docker-compose restart proxy qdrant

# 4. Wait and test
echo "=== Waiting 30 seconds ==="
sleep 30

# 5. Test API endpoint
echo "=== Testing API ==="
curl -k https://mongoatlasfts.io.vn/qdrant/collections || echo "API test failed"

# 6. Show access URLs
echo "=== Access URLs ==="
echo "✅ Working: http://localhost:6333/dashboard#/collections"
echo "🔧 Testing: https://mongoatlasfts.io.vn/qdrant/dashboard#/collections"
```

## 📋 Verification Steps

After applying the fix:

1. **Test API endpoint**:
   ```bash
   curl -k https://mongoatlasfts.io.vn/qdrant/collections
   ```

2. **Test dashboard access**:
   - Open: `https://mongoatlasfts.io.vn/qdrant/dashboard#/collections`
   - Should show your collections and users

3. **Verify user sync**:
   - Check that all 5 users are visible
   - Create a new user and verify it appears

## 🚨 If Nothing Works

**Fallback Solution**: Use localhost access with SSH tunnel

```bash
# From your local machine
ssh -L 6333:localhost:6333 your-gcp-vm-user@your-vm-ip

# Then access: http://localhost:6333/dashboard#/collections
```

## 📞 Support Commands

If you need help, run these diagnostic commands:

```bash
# Environment check
echo "DOMAIN: $DOMAIN"
echo "STACK_NAME: $STACK_NAME"

# Service status
docker-compose ps

# Network check
docker network ls | grep traefik

# Traefik routes
docker-compose exec proxy traefik api --insecure || echo "Traefik API not available"
```

## ✅ Expected Result

After the fix:
- ✅ `http://localhost:6333/dashboard#/collections` (works)
- ✅ `https://mongoatlasfts.io.vn/qdrant/dashboard#/collections` (should work)
- ✅ User data visible in both
- ✅ New users sync immediately

---

**💡 Pro Tip**: The localhost access proves Qdrant is working perfectly. The issue is purely Traefik routing configuration!