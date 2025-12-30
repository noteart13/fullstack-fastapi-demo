# Server Redeployment Guide

This guide summarizes the correct procedures to redeploy your Full Stack FastAPI + Next.js application on your server.

## ✅ Prerequisites

1.  **SSH into your server:**
    ```bash
    # Replace with your actual SSH command
    gcloud compute ssh fullstack-app-vm --zone=asia-southeast1-a
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd ~/fullstack-fastapi-demo
    ```

3.  **Pull the latest code:**
    ```bash
    git pull origin main
    ```
    *(Or `git pull` if your branch is already set up)*

---

## 🚀 Option 1: Full Redeployment (Recommended)

Use this method when you have changed both Backend and Frontend code, or if you are unsure.

1.  **Load Environment Variables:**
    This step ensures all your variables from `.env` are available to the Docker build command.
    ```bash
    export $(cat .env | grep -v '^#' | xargs)
    ```

2.  **Rebuild Containers:**
    We use `--no-cache` to force a fresh build and ensure the `NEXT_PUBLIC_API_URL` is baked into the frontend correctly.
    ```bash
    # Build Frontend
    docker-compose build --no-cache --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL frontend

    # Build Backend
    docker-compose build --no-cache backend
    ```

3.  **Restart Services:**
    ```bash
    docker-compose down
    docker-compose up -d
    ```

---

## ⚡ Option 2: Frontend-Only Redeployment

Use this if you **only** modified files in the `frontend/` directory.

1.  **Load Environment Variables:**
    ```bash
    export $(cat .env | grep -v '^#' | xargs)
    ```

2.  **Rebuild & Restart Frontend:**
    ```bash
    docker-compose build --no-cache --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL frontend
    docker-compose up -d --force-recreate frontend
    ```

---

## ⚙️ Option 3: Backend-Only Redeployment

Use this if you **only** modified files in the `backend/` directory (Python code).

1.  **Rebuild & Restart Backend:**
    ```bash
    docker-compose build --no-cache backend
    docker-compose up -d --force-recreate backend
    ```

2.  **Rebuild & Restart Celery Worker (if tasks changed):**
    ```bash
    docker-compose build --no-cache celeryworker
    docker-compose up -d --force-recreate celeryworker
    ```

---

## 🔍 Verification

After deployment, run these commands to ensure everything is working:

1.  **Check Container Status:**
    All containers should be `Up`.
    ```bash
    docker-compose ps
    ```

2.  **View Logs (Optional):**
    If something isn't working, check the logs.
    ```bash
    docker-compose logs -f --tail=50
    ```

3.  **Manual Test:**
    *   **Frontend:** Visit `https://mongoatlasfts.io.vn`
    *   **Backend:** Visit `https://mongoatlasfts.io.vn/api/v1/users/tester` (Should return a JSON success message)

## ⚠️ Common Troubleshooting

*   **"Connection Refused" on Frontend:** This usually means the `NEXT_PUBLIC_API_URL` wasn't set during build. **Redo Option 1** carefully.
*   **Browser Caching:** If you don't see changes, try opening your site in an **Incognito Window**.
