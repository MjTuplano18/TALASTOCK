#!/bin/bash
# Dev server restart script for Next.js

echo "🔄 Restarting Next.js dev server..."

# Kill any existing node processes on port 3000
echo "📍 Killing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clear Next.js cache
echo "🗑️  Clearing .next cache..."
rm -rf .next

# Clear node_modules cache (optional, uncomment if needed)
# echo "🗑️  Clearing node_modules cache..."
# rm -rf node_modules/.cache

echo "✅ Cache cleared!"
echo "🚀 Starting dev server..."
echo ""

# Start dev server
npm run dev
