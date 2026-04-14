# Dev server restart script for Next.js (PowerShell/Windows)

Write-Host "🔄 Restarting Next.js dev server..." -ForegroundColor Cyan

# Kill any existing node processes on port 3000
Write-Host "📍 Killing processes on port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Killed $($processes.Count) process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No processes found on port 3000" -ForegroundColor Gray
}

# Clear Next.js cache
Write-Host "🗑️  Clearing .next cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✅ Cache cleared!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cache to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting dev server..." -ForegroundColor Cyan
Write-Host ""

# Start dev server
npm run dev
