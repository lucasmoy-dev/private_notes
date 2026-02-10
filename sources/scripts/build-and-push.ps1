param (
    [string]$Message = "Release"
)

Write-Host "Starting Git Push..." -ForegroundColor Cyan

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "⚠️ No changes to commit." -ForegroundColor Yellow
    return
}

git add .
git commit -m $Message
git push

Write-Host "✅ Changes pushed to Git" -ForegroundColor Green
