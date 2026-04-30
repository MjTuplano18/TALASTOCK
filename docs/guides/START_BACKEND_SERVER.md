# Start Backend Server - Quick Guide

## Problem
The frontend is trying to connect to `http://localhost:8000` but the backend server isn't running.

Error: `GET https://talastocks.onrender.com/api/v1/customers?per_page=100 404 (Not Found)`

## Solution: Start the Backend Server

### Option 1: Start Locally (Recommended for Development)

#### Step 1: Open a New Terminal
Open a **new terminal window** (don't close your frontend terminal)

#### Step 2: Navigate to Backend Directory
```bash
cd backend
```

#### Step 3: Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

#### Step 4: Start the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Step 5: Test the Server
Open your browser and go to:
- http://localhost:8000/health

You should see:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "env": "development"
}
```

#### Step 6: Test Customers Endpoint
Go to:
- http://localhost:8000/api/v1/customers

You should see:
```json
{
  "success": true,
  "data": [],
  "message": "OK",
  "meta": {
    "total": 0,
    "page": 1,
    "per_page": 20
  }
}
```

### Option 2: Use Deployed Backend (Production)

If you want to use the deployed backend on Render instead:

#### Step 1: Update Frontend Environment Variable

Edit `frontend/.env.local`:

```env
# Change from:
NEXT_PUBLIC_API_URL=http://localhost:8000

# To:
NEXT_PUBLIC_API_URL=https://talastocks.onrender.com
```

#### Step 2: Restart Frontend
```bash
# Stop the frontend (Ctrl+C)
# Then restart:
npm run dev
```

**Note:** The Render backend might be in "cold start" mode and take 30-60 seconds to wake up on first request.

---

## Troubleshooting

### Error: "Address already in use"
Port 8000 is already taken. Either:
1. Kill the existing process
2. Use a different port:
   ```bash
   uvicorn main:app --reload --port 8001
   ```
   Then update `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

### Error: "ModuleNotFoundError"
Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Error: "No module named 'uvicorn'"
Install uvicorn:
```bash
pip install uvicorn
```

### Backend Starts But Frontend Still Gets 404
1. Check the backend logs for errors
2. Verify the URL in browser: http://localhost:8000/health
3. Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`
4. Restart the frontend after changing `.env.local`

### CORS Errors
Make sure `backend/.env` has:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Quick Start Script (Windows)

Create `backend/start.bat`:
```batch
@echo off
echo Starting Talastock Backend Server...
call venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then just double-click `start.bat` to start the server.

---

## Quick Start Script (Mac/Linux)

Create `backend/start.sh`:
```bash
#!/bin/bash
echo "Starting Talastock Backend Server..."
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Make it executable:
```bash
chmod +x start.sh
```

Then run:
```bash
./start.sh
```

---

## Verify Everything Works

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```

### 2. Customers Endpoint (Requires Auth)
```bash
# Get your auth token from browser DevTools (Application > Local Storage > supabase.auth.token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/v1/customers
```

### 3. Frontend Test
1. Open http://localhost:3000
2. Login
3. Go to Reports → Credit Reports
4. Customer dropdown should load without errors

---

## Next Steps

After starting the backend:
1. ✅ Refresh your frontend browser
2. ✅ The "Failed to fetch customers" error should be gone
3. ✅ Customer dropdown should load
4. ✅ Credit Reports tab should work

---

**Status:** Ready to start  
**Time to Fix:** 2 minutes  
**Priority:** HIGH (blocking feature)
