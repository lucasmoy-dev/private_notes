param (
    [string]$Choice
)

function Show-Menu {
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host "   Private Notes Release Manager   " -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host "1. All (WebApp and Android Release)"
    Write-Host "2. WebApp Release"
    Write-Host "3. Android Release"
    Write-Host "4. Exit"
    Write-Host "===================================" -ForegroundColor Cyan
}

if ([string]::IsNullOrEmpty($Choice)) {
    Show-Menu
    $Choice = Read-Host "Select an option (1-4)"
}

# Constants and Paths
$updateScriptPath = Join-Path (Get-Location) "sources\scripts\update-version.ps1"
$pushScriptPath = Join-Path (Get-Location) "sources\scripts\build-and-push.ps1"
$androidReleaseScript = Join-Path (Get-Location) "sources\scripts\android-release.ps1"
$webappPath = Join-Path (Get-Location) "sources\webapp"
$releaseDir = Join-Path (Get-Location) "releases\webapp"

function Update-Version {
    $newVer = & $updateScriptPath
    if (-not $newVer) {
        Write-Host "❌ Failed to update version" -ForegroundColor Red
        return $null
    }
    return $newVer
}

function Build-WebApp {
    Write-Host "Building WebApp..." -ForegroundColor Yellow
    Push-Location $webappPath
    npm run build
    Pop-Location
}

function Copy-WebApp-To-Releases {
    if (!(Test-Path $releaseDir)) { New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null }
    Write-Host "Copying to releases/webapp..." -ForegroundColor Yellow
    Remove-Item "$releaseDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "$webappPath\dist\*" $releaseDir -Recurse -Force
}

function Build-Android {
    param($version)
    Write-Host "Starting Android build..." -ForegroundColor Yellow
    & $androidReleaseScript -Version $version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Android build failed" -ForegroundColor Red
        return $false
    }
    return $true
}

function Push-To-Git {
    param($message)
    Write-Host "Pushing to Git..." -ForegroundColor Yellow
    & $pushScriptPath -Message $message
}

function Deploy-WebApp {
    Write-Host "Deploying to GitHub Pages..." -ForegroundColor Yellow
    Push-Location $webappPath
    npm run deploy
    Pop-Location
}

switch ($Choice) {
    "1" {
        Write-Host "Starting Full Release..." -ForegroundColor Cyan
        $newVersion = Update-Version
        if ($null -eq $newVersion) { exit 1 }
        
        if (-not (Build-Android -version $newVersion)) { exit 1 }
        
        # WebApp is already built by the Android script
        Copy-WebApp-To-Releases
        
        Push-To-Git -message "Full Release v$newVersion"
        Deploy-WebApp
        Write-Host "✅ Full Release Completed!" -ForegroundColor Green
    }
    "2" {
        Write-Host "Starting WebApp-only Release..." -ForegroundColor Cyan
        $newVersion = Update-Version
        if ($null -eq $newVersion) { exit 1 }
        
        Build-WebApp
        Copy-WebApp-To-Releases
        
        Push-To-Git -message "Web Release v$newVersion"
        Deploy-WebApp
        Write-Host "✅ WebApp Release Completed!" -ForegroundColor Green
    }
    "3" {
        Write-Host "Starting Android-only Release..." -ForegroundColor Cyan
        $newVersion = Update-Version
        if ($null -eq $newVersion) { exit 1 }
        
        if (-not (Build-Android -version $newVersion)) { exit 1 }
        
        Push-To-Git -message "Android Release v$newVersion"
        Write-Host "✅ Android Release Completed!" -ForegroundColor Green
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    Default {
        Write-Host "Invalid option." -ForegroundColor Red
    }
}

