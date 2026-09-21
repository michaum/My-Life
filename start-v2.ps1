Clear-Host

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\Development\My-Life"

Write-Host "========================================"
Write-Host "       STARTING MY LIFE V2"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path $ProjectDir)) {
    Write-Host "MY LIFE V2 - DEVELOPMENT BLOCKED"
    Write-Host "Project folder not found: $ProjectDir"
    return
}

Set-Location $ProjectDir

node scripts/preflight-v2.mjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "My Life V2 was NOT started."
    return
}

$Branch = git branch --show-current
$Commit = git rev-parse --short HEAD

Write-Host ""
Write-Host "========================================"
Write-Host "   MY LIFE V2 IS READY FOR DEVELOPMENT"
Write-Host "========================================"
Write-Host ""
Write-Host "Project: $ProjectDir"
Write-Host "Branch:  $Branch"
Write-Host "Commit:  $Commit"
Write-Host ""