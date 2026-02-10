# APK Build Script - Requires Android Studio

Write-Host "=== Private Notes APK Builder ===" -ForegroundColor Cyan
Write-Host ""

# 1. Build WebApp
Write-Host "[1/3] Building web application..." -ForegroundColor Yellow
$rootPath = Resolve-Path "..\.."
$webappPath = Join-Path $rootPath "sources\webapp"
Push-Location $webappPath
npm run build
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error building webapp" -ForegroundColor Red
    exit 1
}

# 2. Sync with Capacitor
Write-Host "[2/3] Syncing with Capacitor..." -ForegroundColor Yellow
npx cap copy
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error syncing with Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Sync completed" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEXT STEP ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To generate the APK, open Android Studio and:" -ForegroundColor White
Write-Host "  1. File > Open > Select: $PWD\android" -ForegroundColor Gray
Write-Host "  2. Wait for Gradle sync" -ForegroundColor Gray
Write-Host "  3. Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor Gray
Write-Host ""
Write-Host "The APK will be generated at:" -ForegroundColor White
Write-Host "  $PWD\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Gray
Write-Host ""

# Try to open Android Studio if installed
$studioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $studioPath) {
    Write-Host "Open Android Studio now? (Y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        Start-Process $studioPath -ArgumentList "$PWD\android"
    }
}
