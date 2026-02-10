# 1. Increment version (Patch: 3.6.0 -> 3.6.1)
Write-Host "--- Incrementing version ---" -ForegroundColor Cyan
npm version patch --no-git-tag-version

# 2. Sync version with constants.js
Write-Host "--- Syncing constants.js ---" -ForegroundColor Cyan
node update-version.js

# Get the new version for the commit message
$pkg = Get-Content -Raw -Path package.json | ConvertFrom-Json
$VERSION = $pkg.version

# 3. Git Add & Commit
Write-Host "--- Saving changes in Git ---" -ForegroundColor Cyan
git add .
git commit -m "Release v$VERSION"

# 4. Push to repository
Write-Host "--- Pushing to GitHub ---" -ForegroundColor Cyan
git push

# 5. Build & Deploy to GitHub Pages
Write-Host "--- Deploying to GitHub Pages ---" -ForegroundColor Cyan
npm run deploy

Write-Host "--- Done! Version v$VERSION published and deployed ---" -ForegroundColor Green
