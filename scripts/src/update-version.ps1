# Script to increment version
Write-Host "Iniciando actualización de versión..." -ForegroundColor Cyan

$pkgPath = "sources/webapp/package.json"
$constantsPath = "sources/webapp/src/constants.js"

if (!(Test-Path $pkgPath)) {
    Write-Host "❌ Error: No se encontró package.json en $pkgPath" -ForegroundColor Red
    exit 1
}

# 1. Leer y actualizar package.json
$pkg = Get-Content $pkgPath | ConvertFrom-Json
$currentVersion = $pkg.version

# Incrementar el último número (patch)
$parts = $currentVersion.Split('.')
if ($parts.Count -eq 3) {
    $parts[2] = [int]$parts[2] + 1
    $newVersion = $parts -join '.'
}
else {
    $newVersion = $currentVersion + ".1"
}

$pkg.version = $newVersion
$pkg | ConvertTo-Json | Set-Content $pkgPath

Write-Host "✅ Versión de package.json actualizada: $currentVersion -> $newVersion" -ForegroundColor Green

# 2. Actualizar src/constants.js
if (Test-Path $constantsPath) {
    $content = Get-Content $constantsPath -Raw
    $newContent = $content -replace "export const APP_VERSION = 'v?[^']+';", "export const APP_VERSION = 'v$newVersion';"
    $newContent | Set-Content $constantsPath
    Write-Host "✅ APP_VERSION en constants.js actualizada a v$newVersion" -ForegroundColor Green
}

return $newVersion
