# Deployment Instructions

This guide outlines the steps to deploy the recent changes to your server (`mongoatlasfts.io.vn`).

## 1. Prepare Your Server

Ensure you are in the project root directory on your server:

```bash
cd /path/to/full-stack-fastapi-mongodb-main/fullstack-fastapi-demo
```

## 2. Update Codebase

Get the latest code changes (including the fixes for frontend linting, circular dependencies, and the updated `.env` file).

### Option A: Using Git (Recommended)
```bash
git pull origin main
```
*Note: If you have local changes on the server that conflict, you may need to stash them first (`git stash`).*

### Option B: Manual Upload
If you are not using Git on the server, upload the modified files using SCP, SFTP, or your preferred method. Ensure you update:
- The entire `frontend/` directory (contains build fixes).
- The `.env` file (contains new domain config).
- The `frontend/.env.local` file.

## 3. Verify Configuration

Ensure your environment variables are set correctly for production.

1.  **Check `.env`**:
    ```bash
    cat .env
    ```
    Verify:
    - `DOMAIN=mongoatlasfts.io.vn`
    - `NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1`

2.  **Check `frontend/.env.local`**:
    ```bash
    cat frontend/.env.local
    ```
    It should contain:
    ```
    NEXT_PUBLIC_API_URL=https://mongoatlasfts.io.vn/api/v1
    ```

## 4. Deploy Services

You must rebuild the containers, especially the frontend, because the API URL is "baked in" to the Next.js application at build time.

```bash
# 1. Stop the current running services (optional, but good for a clean state)
docker-compose down

# 2. Rebuild and start the services
# The --build flag is CRITICAL to apply frontend changes
docker-compose up -d --build
```

## 5. Verify Deployment

### Check Container Status
Ensure all containers (proxy, backend, frontend, celeryworker, etc.) are `Up`.
```bash
docker-compose ps
```

### Validate Application
1.  **Frontend:** Open [https://mongoatlasfts.io.vn](https://mongoatlasfts.io.vn).
    - Open Developer Tools (F12) -> Network tab.
    - Try to login.
    - Verify that requests are going to `https://mongoatlasfts.io.vn/api/v1/...` and **not** `localhost`.
2.  **Backend Docs:** Open [https://mongoatlasfts.io.vn/api/v1/docs](https://mongoatlasfts.io.vn/api/v1/docs) to ensure the API is reachable.

## 6. Troubleshooting

-   **Frontend requests still hitting localhost?**
    The build didn't pick up the environment variable. Double-check `frontend/.env.local` and run `docker-compose build --no-cache frontend` followed by `docker-compose up -d`.
-   **502 Bad Gateway?**
    The backend might be crashing. Check logs:
    ```bash
    docker-compose logs -f backend
    ```
-   **Database Connection Error?**
    Check `docker-compose logs -f backend`. If it can't connect to MongoDB, ensure your server's IP address is whitelisted in your MongoDB Atlas Network Access settings.
