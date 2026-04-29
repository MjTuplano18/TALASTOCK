# Force Render to Redeploy with Customers Router

## Issue
The customers router exists in the code and is pushed to GitHub, but Render is still returning 404 for `/api/v1/customers`.

## Root Cause
Render might be using cached build artifacts or the deployment didn't pick up the new router file.

## Solution: Force a Clean Deployment

### Step 1: Clear Render Build Cache
1. Go to https://dashboard.render.com
2. Click on your **talastocks** backend service
3. Go to **Settings** (left sidebar)
4. Scroll down to **Build & Deploy** section
5. Click **"Clear build cache"**
6. Confirm the action

### Step 2: Trigger Manual Deploy
1. Go back to the service dashboard
2. Click **"Manual Deploy"** (top right)
3. Select **"Clear build cache & deploy"**
4. Wait for deployment to complete (watch the logs)

### Step 3: Verify Deployment Logs
Watch for these lines in the deployment logs:

```
INFO: All routers imported successfully
```

If you see an import error like:
```
Failed to import routers: No module named 'customers'
```

Then the file isn't being deployed properly.

### Step 4: Test the Endpoint
After deployment completes, test:

```
https://talastocks.onrender.com/api/v1/customers
```

Expected response:
```json
{"detail":"Not authenticated"}
```

NOT:
```json
{"detail":"Not Found"}
```

## Alternative: Add a Dummy Commit to Force Redeploy

If clearing cache doesn't work, make a small change to force a new deployment:

```bash
# Add a comment to main.py
echo "# Force redeploy" >> backend/main.py

# Commit and push
git add backend/main.py
git commit -m "Force Render redeploy - add customers router"
git push origin main
```

This will trigger a fresh deployment from scratch.

## Debugging: Check What Files Render Has

If the issue persists, check Render's environment:

1. In Render dashboard, go to your service
2. Click **"Shell"** tab (if available on your plan)
3. Run:
   ```bash
   ls -la backend/routers/
   cat backend/main.py | grep customers
   ```

This will show if the customers.py file exists in Render's deployed code.

## Last Resort: Redeploy from Scratch

If nothing works:

1. In Render dashboard, go to Settings
2. Scroll to bottom
3. Click **"Delete Service"**
4. Create a new service pointing to your GitHub repo
5. Configure environment variables again
6. Deploy

This ensures a completely fresh deployment with no cached artifacts.
