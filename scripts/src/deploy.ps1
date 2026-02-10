# 1. Incrementar version (Patch: 3.6.0 -> 3.6.1)
Write-Host "--- Incrementando version ---" -ForegroundColor Cyan
npm version patch --no-git-tag-version

# 2. Sincronizar version con constants.js
Write-Host "--- Sincronizando constants.js ---" -ForegroundColor Cyan
node update-version.js

# Obtener la nueva version para el mensaje de commit
$pkg = Get-Content -Raw -Path package.json | ConvertFrom-Json
$VERSION = $pkg.version

# 3. Git Add & Commit
Write-Host "--- Guardando cambios en Git ---" -ForegroundColor Cyan
git add .
git commit -m "Release v$VERSION"

# 4. Push a repositorio
Write-Host "--- Subiendo a GitHub ---" -ForegroundColor Cyan
git push

# 5. Build & Deploy a GitHub Pages
Write-Host "--- Desplegando en GitHub Pages ---" -ForegroundColor Cyan
npm run deploy

Write-Host "--- Listo! Version v$VERSION publicada y desplegada ---" -ForegroundColor Green
