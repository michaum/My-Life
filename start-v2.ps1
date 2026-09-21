Clear-Host

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\Development\My-Life"

if (-not (Test-Path $ProjectDir)) {

    Write-Host "============================================================"
    Write-Host "             MY LIFE V2 - DEVELOPMENT BLOCKED" -ForegroundColor Red
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Developer : Marcel"
    Write-Host "Machine   : WINDOWS 11 WORK LAPTOP"
    Write-Host "Project   : My Life V2"
    Write-Host ""
    Write-Host "PROJECT FOLDER NOT FOUND" -ForegroundColor Red
    Write-Host $ProjectDir
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "                 NOT READY TO CODE" -ForegroundColor Red
    Write-Host "============================================================"
    Write-Host ""

    return
}

Set-Location $ProjectDir

node scripts/preflight-v2.mjs

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "============================================================"
    Write-Host "             MY LIFE V2 - DEVELOPMENT BLOCKED" -ForegroundColor Red
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Developer : Marcel"
    Write-Host "Machine   : WINDOWS 11 WORK LAPTOP"
    Write-Host "Project   : My Life V2"
    Write-Host ""
    Write-Host "PREFLIGHT FAILED - DO NOT START DEVELOPMENT" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the issue reported above before changing code." -ForegroundColor Red
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "                 NOT READY TO CODE" -ForegroundColor Red
    Write-Host "============================================================"
    Write-Host ""

    Set-Location $ProjectDir
    return
}

$Branch = (git branch --show-current).Trim()
$Commit = (git rev-parse --short HEAD).Trim()
$NodeVersion = (node --version).Trim()
$NpmVersion = (npm --version).Trim()

Clear-Host

Write-Host "============================================================"
Write-Host "              MY LIFE V2 - DEVELOPMENT READY" -ForegroundColor Green
Write-Host "============================================================"
Write-Host ""
Write-Host "Developer : Marcel"
Write-Host "Machine   : WINDOWS 11 WORK LAPTOP"
Write-Host "Project   : My Life V2"
Write-Host "Branch    : $Branch"
Write-Host "Commit    : $Commit"
Write-Host "Node      : $NodeVersion"
Write-Host "npm       : $NpmVersion"
Write-Host ""
Write-Host "Repository: $ProjectDir"
Write-Host "PREFLIGHT : PASSED" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================"
Write-Host "                 READY TO CODE" -ForegroundColor Green
Write-Host "============================================================"
Write-Host ""

Set-Location $ProjectDir
