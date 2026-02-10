# Script to build Android APK using Docker
Param($Version = "latest")

Write-Host "=== Compilador Android PRO (Docker Mode) ===" -ForegroundColor Cyan

$rootPath = Get-Location
$webappPath = Join-Path $rootPath "sources/webapp"
$mobilePath = Join-Path $rootPath "sources/mobile"
$releasesPath = Join-Path $rootPath "releases"
$apkPathInAndroid = Join-Path $mobilePath "android/app/build/outputs/apk/debug/app-debug.apk"

# 1. Limpieza de APK antigua
if (Test-Path $apkPathInAndroid) { Remove-Item -Force $apkPathInAndroid }

# 2. Compilar App Web
Write-Host "`n[1/4] Compilando Aplicación Web..." -ForegroundColor Yellow
Set-Location $webappPath
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en build web"; Set-Location $rootPath; exit 1 }

# 3. Sincronizar con Capacitor e Iconos
Write-Host "`n[2/4] Sincronizando con Capacitor..." -ForegroundColor Yellow
Set-Location $mobilePath

# Asegurar que los assets de origen existen para iconos
if (!(Test-Path "assets/icon.png")) {
    if (!(Test-Path "assets")) { New-Item -ItemType Directory -Path "assets" }
    Copy-Item "$webappPath/public/favicon.png" "assets/icon.png"
    Copy-Item "$webappPath/public/favicon.png" "assets/splash.png"
    Copy-Item "$webappPath/public/favicon.png" "assets/splash-dark.png"
}
npx capacitor-assets generate --android
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Error en sync"; Set-Location $rootPath; exit 1 }

# 4. Compilar APK con Docker
Write-Host "`n[3/4] Compilando APK en Docker..." -ForegroundColor Yellow

# Renombrar local.properties para evitar que Docker lo use (contiene rutas de Windows)
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
    Write-Host "❌ Error crítico: La compilación en Docker falló." -ForegroundColor Red
    if (Test-Path $localPropBak) { Rename-Item -Path $localPropBak -NewName "local.properties" -Force }
    Set-Location $rootPath
    exit 1
}
finally {
    # Restaurar local.properties
    if (Test-Path $localPropBak) {
        Rename-Item -Path $localPropBak -NewName "local.properties" -Force
    }
}

# 5. Finalizar y Copiar
Write-Host "`n[4/4] Verificando resultado..." -ForegroundColor Yellow
if (Test-Path $apkPathInAndroid) {
    if (!(Test-Path $releasesPath)) { New-Item -ItemType Directory -Path $releasesPath }
    
    $finalName = "private-notes-v$Version.apk"
    Copy-Item $apkPathInAndroid (Join-Path $releasesPath $finalName)
    Copy-Item $apkPathInAndroid (Join-Path $releasesPath "private-notes-latest.apk")
    
    Write-Host "`n✅ ¡APK Generada con éxito!" -ForegroundColor Green
    Write-Host "Archivo: $finalName" -ForegroundColor White
}
else {
    Write-Host "❌ Error: No se encontró la APK generada." -ForegroundColor Red
    Set-Location $rootPath
    exit 1
}

Set-Location $rootPath
