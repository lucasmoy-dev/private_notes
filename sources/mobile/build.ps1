# Script para compilar APK - Requiere Android Studio

Write-Host "=== Compilador de APK para Private Notes ===" -ForegroundColor Cyan
Write-Host ""

# 1. Compilar webapp
Write-Host "[1/3] Compilando aplicación web..." -ForegroundColor Yellow
Set-Location ..
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar la webapp" -ForegroundColor Red
    exit 1
}

# 2. Sincronizar con Capacitor
Write-Host "[2/3] Sincronizando con Capacitor..." -ForegroundColor Yellow
Set-Location mobile
npx cap copy
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al sincronizar con Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Sincronización completada" -ForegroundColor Green
Write-Host ""
Write-Host "=== SIGUIENTE PASO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para generar la APK, abre Android Studio y:" -ForegroundColor White
Write-Host "  1. File > Open > Selecciona: $PWD\android" -ForegroundColor Gray
Write-Host "  2. Espera a que Gradle sincronice" -ForegroundColor Gray
Write-Host "  3. Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor Gray
Write-Host ""
Write-Host "La APK se generará en:" -ForegroundColor White
Write-Host "  $PWD\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Gray
Write-Host ""

# Intentar abrir Android Studio si está instalado
$studioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $studioPath) {
    Write-Host "¿Abrir Android Studio ahora? (S/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Start-Process $studioPath -ArgumentList "$PWD\android"
    }
}

Set-Location ..
