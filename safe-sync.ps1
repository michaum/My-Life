$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "       MY LIFE V2 - SAFE SYNC"
Write-Host "========================================"

$branch = git branch --show-current

if ($branch -ne "v2-redesign") {
    Write-Host ""
    Write-Host "STOP: You are on branch '$branch'."
    Write-Host "Safe Sync only operates on v2-redesign."
    exit 1
}

Write-Host ""
Write-Host "Checking for local changes..."

$status = git status --porcelain

if ($status) {
    Write-Host ""
    Write-Host "STOP: This computer has uncommitted changes."
    Write-Host "Nothing has been downloaded or overwritten."
    Write-Host ""
    git status --short
    exit 1
}

Write-Host "Local files are clean."

Write-Host ""
Write-Host "Checking GitHub..."
git fetch origin

$local  = git rev-parse HEAD
$remote = git rev-parse origin/v2-redesign
$base   = git merge-base HEAD origin/v2-redesign

Write-Host ""

if ($local -eq $remote) {
    Write-Host "SAFE: This computer and GitHub already match."
    exit 0
}

if ($local -eq $base) {
    Write-Host "GitHub has newer work."
    Write-Host "Safely updating this computer..."
    git merge --ff-only origin/v2-redesign

    Write-Host ""
    Write-Host "DONE: This computer now matches GitHub."
    exit 0
}

if ($remote -eq $base) {
    Write-Host "SAFE: This computer has newer committed work."
    Write-Host "Nothing was overwritten."
    Write-Host "Push your commits to GitHub when ready."
    exit 0
}

Write-Host "STOP: This computer and GitHub contain different newer work."
Write-Host "Nothing was merged, deleted, or overwritten."
Write-Host "We need to reconcile the changes manually."
exit 1
