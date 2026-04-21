# Revenue Goal Setup Guide

## Overview
The monthly revenue goal is now stored in the database instead of localStorage, ensuring it persists across browser sessions and devices.

## Quick Setup Steps

### 1. Get Your Supabase Service Key

1. Go to https://supabase.com/dashboard
2. Select your project: `uwzidzpwiceijjcmifum`
3. Go to **Settings** → **API**
4. Under **Project API keys**, find the **service_role** key (NOT the anon key)
5. Copy the service_role key

### 2. Update Backend .env File

Edit `backend/.env` and replace `YOUR_SERVICE_KEY_HERE` with your actual service_role key.

The file should look like this:

```env
# Supabase Configuration (Backend)
SUPABASE_URL=https://uwzidzpwiceijjcmifum.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SERVICE_KEY_HERE
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlkenB3aWNlaWpqY21pZnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTI1MTYsImV4cCI6MjA5MTYyODUxNn0.fA2ZR8omA7wmTtJEoEsvwX5c2C0kR_Kvx2XWsKOpaME

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Environment
ENV=development
```

**IMPORTANT**: 
- `SUPABASE_SERVICE_KEY` is used for database operations (bypasses RLS)
- `SUPABASE_ANON_KEY` is used for verifying user authentication tokens
- Never commit the service_role key to git!

### 3. Restart Backend Server

Stop your backend server (Ctrl+C) and restart:

```bash
cd backend
source venv/Scripts/activate  # Windows bash
# Or: venv\Scripts\activate  # Windows PowerShell
uvicorn main:app --reload --port 8000
```

### 4. Test the Feature

1. Make sure both servers are running (backend on :8000, frontend on :3000)
2. Log in to the dashboard
3. Click the edit icon (✏️) on the Revenue Goal card
4. Change the goal value (e.g., to 75000)
5. Click save (✓)
6. Refresh the page - the new goal should persist!

## Troubleshooting

### 401 Unauthorized Error
- Make sure you're logged in to the dashboard
- Check that `SUPABASE_ANON_KEY` is set in `backend/.env`
- Restart the backend server after updating `.env`

### 500 Internal Server Error
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set in `backend/.env`
- Verify the service key is correct (copy from Supabase dashboard)
- Restart the backend server

### CORS Error
- Verify `CORS_ORIGINS=http://localhost:3000` is in `backend/.env`
- Restart the backend server

### Setting Not Found (404)
- Run the migration in Supabase SQL Editor:
  ```sql
  -- Check if settings table exists
  SELECT * FROM settings WHERE key = 'monthly_revenue_goal';
  
  -- If empty, insert default:
  INSERT INTO settings (key, value) 
  VALUES ('monthly_revenue_goal', 50000)
  ON CONFLICT (key) DO NOTHING;
  ```

## Architecture

```
Frontend (Dashboard)
    ↓
useRevenueGoal Hook
    ↓
Fetch API → localhost:8000/api/v1/settings/monthly_revenue_goal
    ↓
FastAPI Backend
    ├─ Auth: Verify user token (using SUPABASE_ANON_KEY)
    └─ Database: Query/update settings (using SUPABASE_SERVICE_KEY)
    ↓
Supabase PostgreSQL
```

## API Endpoints

### GET /api/v1/settings/monthly_revenue_goal
Fetch the current revenue goal.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "monthly_revenue_goal",
    "value": 50000,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/v1/settings/monthly_revenue_goal
Update the revenue goal.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "value": 75000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "monthly_revenue_goal",
    "value": 75000,
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## Security Notes

- The service_role key bypasses Row Level Security (RLS) - use only in backend
- Never expose the service_role key to the frontend
- The frontend uses the anon key for authentication
- All settings endpoints require authentication (Bearer token)
- CORS is configured to only allow requests from localhost:3000 in development
