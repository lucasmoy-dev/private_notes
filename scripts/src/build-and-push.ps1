param (
    [string]$Message = "Release"
)

Write-Host "Iniciando Git Push..." -ForegroundColor Cyan

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "⚠️ No hay cambios para commitear." -ForegroundColor Yellow
    return
}

git add .
git commit -m $Message
git push

Write-Host "✅ Cambios subidos a Git" -ForegroundColor Green
