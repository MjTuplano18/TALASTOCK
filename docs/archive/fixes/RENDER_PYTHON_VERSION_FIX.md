# Fix Render Python Version Issue

## Problem
Render is ignoring `runtime.txt` and using Python 3.14.3 by default, which causes pydantic-core build failures.

## Solution: Set Python Version in Render Dashboard

### Step 1: Go to Render Dashboard
1. Go to https://dashboard.render.com
2. Click on your TALASTOCK service
3. Go to "Settings" tab

### Step 2: Set Python Version
Scroll down to find **"Python Version"** setting and set it to:
```
3.11.9
```

OR in the Environment section, add:
```
PYTHON_VERSION=3.11.9
```

### Step 3: Manual Deploy
1. Go to "Manual Deploy" section
2. Click "Deploy latest commit"
3. Wait for build to complete

## Alternative: Use .python-version File

If the above doesn't work, Render also reads `.python-version` file:

Create `backend/.python-version` with content:
```
3.11.9
```

## Why This Happens

Render's Python version detection priority:
1. Environment variable `PYTHON_VERSION`
2. Dashboard setting "Python Version"
3. `.python-version` file
4. `runtime.txt` file (Heroku-style, may not work on Render)
5. Default (currently 3.14.3)

Since `runtime.txt` is low priority, it's being ignored.

## Quick Fix Commands

```bash
# Create .python-version file
echo "3.11.9" > backend/.python-version

# Commit and push
git add backend/.python-version backend/requirements.txt
git commit -m "Fix: Use .python-version for Render deployment"
git push origin main
```

## Expected Result

After setting Python version correctly, you should see in Render logs:
```
==> Using Python version 3.11.9 (from environment/settings)
==> Installing Python version 3.11.9...
==> Running build command 'pip install -r requirements.txt'...
✅ Successfully installed pydantic-2.9.2
✅ Build succeeded 🎉
```
