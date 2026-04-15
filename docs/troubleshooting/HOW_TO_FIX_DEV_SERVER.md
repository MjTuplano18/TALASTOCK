# 🔧 How to Fix "MIME Type" Errors

## The Problem
You see these errors in the browser console:
```
Refused to apply style from '...' because its MIME type ('text/html') is not a supported stylesheet MIME type
```

## The Solution (2 Steps)

### Step 1: Stop the Dev Server
In your terminal where `npm run dev` is running, press:
```
Ctrl + C
```

### Step 2: Restart with Clean Cache
```bash
cd frontend
npm run dev:clean
```

That's it! The dev server will restart with a clean cache.

---

## Why This Happens

The Next.js development server crashed, but your browser is still trying to load files from it. This is a **development-only issue** - your code is fine!

---

## Alternative: Manual Restart

If the script doesn't work, do this manually:

```bash
# 1. Stop the server (Ctrl+C)

# 2. Clear the cache
cd frontend
rm -rf .next

# 3. Restart
npm run dev
```

---

## When to Restart

Restart the dev server when:
- ✅ You see MIME type errors
- ✅ After making many file changes
- ✅ After installing new packages
- ✅ Page shows blank/white screen
- ✅ Hot reload stops working

---

## This is Normal!

Next.js dev server sometimes crashes during development. It's not a bug in your code. Just restart it and keep coding! 🚀

---

**Quick Command:**
```bash
npm run dev:clean
```
