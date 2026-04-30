#!/bin/bash

echo "Testing Talastock Backend..."
echo "=============================="
echo ""

echo "1. Testing health endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://talastocks.onrender.com/health)

if [ "$response" = "200" ]; then
    echo "✅ Backend is RUNNING (HTTP 200)"
    echo ""
    echo "Full response:"
    curl -s https://talastocks.onrender.com/health | jq .
else
    echo "❌ Backend is DOWN (HTTP $response)"
    echo ""
    echo "This means:"
    echo "  - Render deployment failed"
    echo "  - Backend is not responding"
    echo "  - All API calls will fail with CORS errors"
    echo ""
    echo "FIX: Go to Render dashboard and add PYTHON_VERSION=3.11.9"
fi

echo ""
echo "=============================="
