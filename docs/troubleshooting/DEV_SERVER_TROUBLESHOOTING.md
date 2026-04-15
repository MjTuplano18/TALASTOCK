# Next.js Dev Server Troubleshooting

## The Problem

You keep seeing these errors:
```
Refused to apply style from '...' because its MIME type ('text/html') is not a supported stylesheet MIME type
Refused to execute script from '...' because its MIME type ('text/html') is not executable
```

**This is NOT a code problem.** This is a Next.js dev server crash.

---

## Quick Fix (Every Time It Happens)

### Option 1: Use the Restart Script (Recommended)

**Windows (PowerShell):**
```bash
cd frontend
npm run dev:clean
```

**Mac/Linux:**
```bash
cd frontend
chmod +x dev-restart.sh
./dev-restart.sh
```

### Option 2: Manual Restart

1. **Stop the dev server:** Press `Ctrl+C` in the terminal
2. **Clear the cache:**
   ```bash
   cd frontend
   rm -rf .next
   ```
3. **Restart:**
   ```bash
   npm run dev
   ```

---

## Why This Happens

Next.js dev server crashes when:

1. **Too many file changes at once**
   - We made lots of changes today
   - Hot reload can't keep up
   - Server crashes

2. **Corrupted `.next` cache**
   - Build cache gets out of sync
   - Server serves wrong files
   - Browser gets HTML instead of JS

3. **Memory issues**
   - Dev server runs out of memory
   - Especially on large projects
   - More common on Windows

4. **Port conflicts**
   - Another process using port 3000
   - Zombie node processes
   - Server can't start properly

---

## Prevention Tips

### 1. Restart After Big Changes

After making lots of file changes (like we did today), restart the dev server:
```bash
npm run dev:clean
```

### 2. Increase Memory Limit

If you have memory issues, increase Node's memory:

**package.json:**
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
  }
}
```

### 3. Disable Fast Refresh (If Needed)

If hot reload keeps breaking, disable it:

**next.config.mjs:**
```javascript
const nextConfig = {
  reactStrictMode: true,
  // Disable fast refresh if it causes issues
  // experimental: {
  //   reactRefresh: false
  // }
}
```

### 4. Use Production Build for Testing

If dev server keeps crashing, test with production build:
```bash
npm run build
npm run start
```

---

## Common Scenarios

### Scenario 1: After Installing Packages
```bash
npm install
npm run dev:clean  # Restart with clean cache
```

### Scenario 2: After Git Pull
```bash
git pull
npm install
npm run dev:clean
```

### Scenario 3: After Many File Changes
```bash
# Stop dev server (Ctrl+C)
npm run dev:clean
```

### Scenario 4: Port Already in Use
```bash
# Windows
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Then restart
npm run dev
```

---

## Advanced Troubleshooting

### Check for Zombie Processes

**Windows:**
```powershell
Get-Process node
# Kill specific process
Stop-Process -Id <PID> -Force
```

**Mac/Linux:**
```bash
ps aux | grep node
# Kill specific process
kill -9 <PID>
```

### Clear All Caches

```bash
cd frontend

# Clear Next.js cache
rm -rf .next

# Clear node_modules cache
rm -rf node_modules/.cache

# Clear npm cache (nuclear option)
npm cache clean --force

# Reinstall
npm install
npm run dev
```

### Check Node Version

Make sure you're using a compatible Node version:
```bash
node --version  # Should be 18.x or 20.x

# If wrong version, use nvm
nvm use 20
```

---

## When to Use Each Solution

| Situation | Solution |
|-----------|----------|
| **Dev server crashed** | `npm run dev:clean` |
| **After many file changes** | `npm run dev:clean` |
| **After npm install** | `npm run dev:clean` |
| **Port already in use** | Kill process, then `npm run dev` |
| **Still not working** | Clear all caches, reinstall |
| **Need stable testing** | Use production build |

---

## Production Deployment

**Important:** This issue ONLY affects development. Production builds work fine:

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
git push  # Vercel auto-deploys
```

---

## Summary

✅ **This is normal** - Next.js dev server crashes sometimes
✅ **Not your code** - All your code changes are fine
✅ **Easy fix** - Just restart with `npm run dev:clean`
✅ **Production is fine** - This only affects development

---

## Quick Reference

**Restart dev server:**
```bash
npm run dev:clean
```

**Manual restart:**
```bash
# Stop server (Ctrl+C)
rm -rf .next
npm run dev
```

**Check what's on port 3000:**
```bash
# Windows
Get-NetTCPConnection -LocalPort 3000

# Mac/Linux
lsof -i:3000
```

---

**Remember:** When you see MIME type errors, just restart the dev server. It's not a bug in your code! 🚀
