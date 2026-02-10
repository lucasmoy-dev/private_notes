# Script to increment version
Write-Host "Starting version update..." -ForegroundColor Cyan

$pkgPath = "sources/webapp/package.json"
$constantsPath = "sources/webapp/src/constants.js"

if (!(Test-Path $pkgPath)) {
    Write-Host "❌ Error: package.json not found at $pkgPath" -ForegroundColor Red
    exit 1
}

# 1. Read and update package.json
$pkg = Get-Content $pkgPath | ConvertFrom-Json
$currentVersion = $pkg.version

# Increment patch version
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

Write-Host "✅ package.json version updated: $currentVersion -> $newVersion" -ForegroundColor Green

# 2. Update src/constants.js
if (Test-Path $constantsPath) {
    $content = Get-Content $constantsPath -Raw
    $newContent = $content -replace "export const APP_VERSION = 'v?[^']+';", "export const APP_VERSION = 'v$newVersion';"
    $newContent | Set-Content $constantsPath
    Write-Host "✅ APP_VERSION in constants.js updated to v$newVersion" -ForegroundColor Green
}

return $newVersion
