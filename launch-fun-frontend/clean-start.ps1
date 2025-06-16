# Clean and restart Next.js dev server
Write-Host "Cleaning Next.js build cache..." -ForegroundColor Yellow

# Try to remove .next directory
try {
    if (Test-Path .next) {
        # First try to stop any processes that might be using the files
        Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Now remove the directory
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host ".next directory removed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not remove .next directory. It may be in use." -ForegroundColor Red
    Write-Host "Please close all terminals and try again." -ForegroundColor Yellow
}

# Clean node_modules/.cache if it exists
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "node_modules/.cache removed" -ForegroundColor Green
}

Write-Host "Starting dev server..." -ForegroundColor Yellow
npm run dev