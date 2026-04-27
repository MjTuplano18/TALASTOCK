# Render Build Fix - Python Version Issue

## Problem

Render was using Python 3.14.3 which is too new and doesn't have pre-built wheels for `pydantic-core`. This caused a build failure:

```
error: failed to create directory `/usr/local/cargo/registry/cache/index.crates.io-1949cf8c6b5b557f`
Caused by: Read-only file system (os error 30)
```

## Solution

Created `backend/runtime.txt` to specify Python 3.11.9 and downgraded pydantic to a version with pre-built wheels.

### Files Changed:

1. **backend/runtime.txt** (NEW)
   ```
   python-3.11.9
   ```

2. **backend/requirements.txt** (UPDATED)
   ```
   pydantic==2.9.2
   pydantic-core==2.23.4
   ```

## What Happens Next

1. ✅ Changes pushed to GitHub
2. ⏳ Render will auto-detect the push and redeploy
3. ⏳ Build should succeed with Python 3.11.9
4. ⏳ Your backend will be live at your Render URL

## Check Deployment Status

Go to your Render dashboard and watch the deployment logs. You should see:

```
==> Using Python version 3.11.9 (from runtime.txt)
==> Installing Python version 3.11.9...
==> Running build command 'pip install -r requirements.txt'...
✅ Successfully installed pydantic-2.9.2 pydantic-core-2.23.4
==> Build succeeded 🎉
```

## After Successful Deployment

1. Copy your Render URL (e.g., `https://talastock.onrender.com`)
2. Go to Vercel → Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` to your Render URL
4. Redeploy frontend in Vercel
5. Test credit sales - should work!

## Why This Happened

- Python 3.14 is very new (released recently)
- Many Python packages don't have pre-built wheels for 3.14 yet
- `pydantic-core` requires Rust compilation for 3.14
- Render's build environment has read-only filesystem restrictions
- Solution: Use Python 3.11 which has stable, pre-built wheels

## Recommended Python Versions for Production

- ✅ Python 3.11.x - Stable, well-supported
- ✅ Python 3.12.x - Newer, good support
- ⚠️ Python 3.13.x - Very new, limited package support
- ❌ Python 3.14.x - Too new, many packages not ready

## Commit Details

```
commit 69659c6
Fix Render deployment: Use Python 3.11 and compatible pydantic versions

- Add runtime.txt to specify Python 3.11.9
- Downgrade pydantic to 2.9.2 (has pre-built wheels)
- Add explicit pydantic-core 2.23.4
```

---

**Your backend should deploy successfully now!** 🚀
