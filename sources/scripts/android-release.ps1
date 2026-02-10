# Script to build Android APK using Docker
Param($Version = "latest")

Write-Host "=== Android Release Builder (Docker Mode) ===" -ForegroundColor Cyan

$rootPath = Get-Location
$webappPath = Join-Path $rootPath "sources/webapp"
$mobilePath = Join-Path $rootPath "sources/mobile"
$releasesPath = Join-Path $rootPath "releases"
$apkPathInAndroid = Join-Path $mobilePath "android/app/build/outputs/apk/debug/app-debug.apk"

# 1. Clean old APK
if (Test-Path $apkPathInAndroid) { Remove-Item -Force $apkPathInAndroid }

# 2. Build WebApp
Write-Host "`n[1/4] Building Web Application..." -ForegroundColor Yellow
Set-Location $webappPath
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error in web build"; Set-Location $rootPath; exit 1 }

# 3. Sync with Capacitor and Assets
Write-Host "`n[2/4] Syncing with Capacitor..." -ForegroundColor Yellow
Set-Location $mobilePath

# Ensure source assets exist for icons
if (!(Test-Path "assets/icon.png")) {
    if (!(Test-Path "assets")) { New-Item -ItemType Directory -Path "assets" }
    Copy-Item "$webappPath/public/favicon.png" "assets/icon.png"
    Copy-Item "$webappPath/public/favicon.png" "assets/splash.png"
    Copy-Item "$webappPath/public/favicon.png" "assets/splash-dark.png"
}

# Verify if Android platform exists
if (!(Test-Path "android")) {
    Write-Host "Initializing Android platform..." -ForegroundColor Cyan
    npx cap add android
}

npx capacitor-assets generate --android
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error in sync"; Set-Location $rootPath; exit 1 }

# 4. Compile APK with Docker
Write-Host "`n[3/4] Compiling APK in Docker..." -ForegroundColor Yellow

# Rename local.properties to avoid Docker using it (contains Windows paths)
$localProp = Join-Path $mobilePath "android/local.properties"
$localPropBak = Join-Path $mobilePath "android/local.properties.bak"
if (Test-Path $localProp) {
    Rename-Item -Path $localProp -NewName "local.properties.bak" -Force
}

try {
    docker-compose down
    docker-compose up --build --exit-code-from android-builder
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
}
catch {
    Write-Host "❌ Critical Error: Docker compilation failed." -ForegroundColor Red
    if (Test-Path $localPropBak) { Rename-Item -Path $localPropBak -NewName "local.properties" -Force }
    Set-Location $rootPath
    exit 1
}
finally {
    # Restore local.properties
    if (Test-Path $localPropBak) {
        Rename-Item -Path $localPropBak -NewName "local.properties" -Force
    }
}

# 5. Finalize and Copy
Write-Host "`n[4/4] Verifying result..." -ForegroundColor Yellow
if (Test-Path $apkPathInAndroid) {
    if (!(Test-Path $releasesPath)) { New-Item -ItemType Directory -Path $releasesPath }
    
    # Remove old versioned APKs to keep only latest
    Remove-Item (Join-Path $releasesPath "private-notes-v*.apk") -ErrorAction SilentlyContinue
    
    $finalName = "private-notes-latest.apk"
    Copy-Item $apkPathInAndroid (Join-Path $releasesPath $finalName) -Force
    
    Write-Host "`n✅ APK Generated successfully!" -ForegroundColor Green
    Write-Host "File: $finalName" -ForegroundColor White
}
else {
    Write-Host "❌ Error: Generated APK not found." -ForegroundColor Red
    Set-Location $rootPath
    exit 1
}

Set-Location $rootPath
