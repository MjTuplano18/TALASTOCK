# PowerShell script to clean restart Next.js frontend
Write-Host "Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*frontend*" } | Stop-Process -Force

Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✓ Cleared .next directory" -ForegroundColor Green
}

Write-Host "Clearing node_modules/.cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✓ Cleared node_modules cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "Environment variables from .env.local:" -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Get-Content ".env.local" | Where-Object { $_ -match "NEXT_PUBLIC" } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
} else {
    Write-Host "  .env.local not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev
