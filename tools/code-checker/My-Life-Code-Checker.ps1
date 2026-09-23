$ErrorActionPreference = "Stop"

$Repo = "C:\Development\My-Life"
$ExpectedBranch = "v2-redesign"
$ExpectedRemote = "https://github.com/michaum/My-Life.git"
$ComputerName = "WINDOWS WORK"

function Header {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Magenta
    Write-Host "              MY-LIFE CODE CHECKER" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host " COMPUTER : $ComputerName" -ForegroundColor Cyan
    Write-Host " PROJECT  : My Life V2.0" -ForegroundColor Cyan
    Write-Host " BRANCH   : $ExpectedBranch" -ForegroundColor Cyan
    Write-Host ""
}

function Stop-Checker([string]$Reason) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host "                    STOP" -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host $Reason -ForegroundColor Red
    Write-Host ""
    Write-Host "No destructive Git operation was performed." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER to close"
    exit 1
}

function Cancel-Checker([string]$Reason) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "              CANCELLED - NOTHING CHANGED" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $Reason -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your existing files remain untouched." -ForegroundColor Green
    Write-Host ""
    Read-Host "Press ENTER to close"
    exit 0
}

function Success {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "              ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "             THIS PC = GITHUB" -ForegroundColor Green
    Write-Host "             AHEAD   : 0" -ForegroundColor Green
    Write-Host "             BEHIND  : 0" -ForegroundColor Green
    Write-Host ""
    Write-Host "     >>> RECOMMENDATION: NO ACTION REQUIRED <<<" -ForegroundColor Green
    Write-Host ""
    Write-Host " Safe to start coding." -ForegroundColor Green
    Write-Host " Safe to close this computer." -ForegroundColor Green
    Write-Host " Safe to continue on the other computer." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press ENTER to close"
    exit 0
}

Header

# Prevent Git from opening a pager.
$env:GIT_PAGER = "cat"
$env:PAGER = "cat"

Write-Host "[1/8] Checking repository..." -ForegroundColor Cyan

if (-not (Test-Path $Repo)) {
    Stop-Checker "Repository not found: $Repo"
}

Set-Location $Repo

try {
    $inside = git rev-parse --is-inside-work-tree 2>$null
} catch {
    Stop-Checker "This folder is not a valid Git repository."
}

if ($inside -ne "true") {
    Stop-Checker "This folder is not a valid Git repository."
}

Write-Host "      PASS" -ForegroundColor Green

Write-Host "[2/8] Checking GitHub remote..." -ForegroundColor Cyan

$remote = (git remote get-url origin).Trim()

if ($remote -ne $ExpectedRemote) {
    Stop-Checker "Wrong GitHub repository.`nExpected: $ExpectedRemote`nFound:    $remote"
}

Write-Host "      PASS" -ForegroundColor Green

Write-Host "[3/8] Checking branch..." -ForegroundColor Cyan

$branch = (git branch --show-current).Trim()

if ($branch -ne $ExpectedBranch) {
    Stop-Checker "Wrong branch.`nExpected: $ExpectedBranch`nFound:    $branch"
}

Write-Host "      PASS" -ForegroundColor Green

Write-Host "[4/8] Contacting GitHub..." -ForegroundColor Cyan

git fetch origin --prune

if ($LASTEXITCODE -ne 0) {
    Stop-Checker "Could not contact GitHub. Check your network connection or GitHub authentication."
}

Write-Host "      PASS" -ForegroundColor Green

Write-Host "[5/8] Inspecting local work..." -ForegroundColor Cyan

$unstaged = @(git diff --name-only)
$staged   = @(git diff --cached --name-only)

$allUntracked = @(git ls-files --others --exclude-standard)

# Development backup files are displayed separately and are not
# automatically included in a PUSH.
$backupFiles = @(
    $allUntracked | Where-Object {
        $_ -match '\.before-[^/\\]+$'
    }
)

$realUntracked = @(
    $allUntracked | Where-Object {
        $_ -notmatch '\.before-[^/\\]+$'
    }
)

Write-Host "      Tracked modified : $($unstaged.Count)" -ForegroundColor White
Write-Host "      Staged           : $($staged.Count)" -ForegroundColor White
Write-Host "      New files        : $($realUntracked.Count)" -ForegroundColor White
Write-Host "      Local backups    : $($backupFiles.Count)" -ForegroundColor DarkGray

Write-Host "[6/8] Comparing this PC with GitHub..." -ForegroundColor Cyan

$counts = (git rev-list --left-right --count HEAD...origin/$ExpectedBranch).Trim() -split '\s+'

if ($counts.Count -lt 2) {
    Stop-Checker "Could not determine Git synchronization state."
}

$ahead  = [int]$counts[0]
$behind = [int]$counts[1]

Write-Host "      Local ahead  : $ahead" -ForegroundColor White
Write-Host "      Local behind : $behind" -ForegroundColor White

Write-Host "[7/8] Determining safe action..." -ForegroundColor Cyan

# Both histories changed independently.
if ($ahead -gt 0 -and $behind -gt 0) {
    Stop-Checker @"
Both this computer and GitHub contain commits the other does not have.

LOCAL AHEAD : $ahead
LOCAL BEHIND: $behind

Automatic synchronization is blocked.
A manual review is required.
"@
}

# GitHub is newer.
if ($behind -gt 0) {

    if ($unstaged.Count -gt 0 -or
        $staged.Count -gt 0 -or
        $realUntracked.Count -gt 0) {

        Stop-Checker @"
GitHub is newer, but this computer also contains local work.

LOCAL BEHIND: $behind

Tracked modified : $($unstaged.Count)
Staged           : $($staged.Count)
New files        : $($realUntracked.Count)

The checker will NOT pull over local work.
"@
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "                 GITHUB IS NEWER" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "GitHub is $behind commit(s) newer than this computer."
    Write-Host ""
    Write-Host "WHAT THIS MEANS:" -ForegroundColor Cyan
    Write-Host "You probably worked on the other computer and pushed"
    Write-Host "those changes to GitHub."
    Write-Host ""
    Write-Host "RECOMMENDED ACTION:" -ForegroundColor Green
    Write-Host "GET the newer files before you start coding." -ForegroundColor Green
    Write-Host ""
    Write-Host ">>> RECOMMENDATION: CHOOSE Y <<<" -ForegroundColor Green
    Write-Host ""

    $answer = Read-Host "GET newest code from GitHub? (Y/N)"

    if ($answer -notmatch '^[Yy]$') {
        Cancel-Checker "GET cancelled by user."
    }

    Write-Host ""
    Write-Host "GETTING FROM GITHUB..." -ForegroundColor Yellow

    git pull --ff-only origin $ExpectedBranch

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "GET failed. No automatic merge was attempted."
    }
}

# Local committed history is newer.
if ($ahead -gt 0 -and $behind -eq 0) {

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host "              THIS COMPUTER IS NEWER" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This computer has $ahead committed change(s)"
    Write-Host "that GitHub does not have."
    Write-Host ""
    Write-Host "WHAT THIS MEANS:" -ForegroundColor Cyan
    Write-Host "Your committed work has not been uploaded yet."
    Write-Host ""
    Write-Host "RECOMMENDED ACTION:" -ForegroundColor Green
    Write-Host "PUSH it to GitHub before leaving this computer." -ForegroundColor Green
    Write-Host ""
    Write-Host ">>> RECOMMENDATION: CHOOSE Y <<<" -ForegroundColor Green
    Write-Host ""

    $answer = Read-Host "PUSH committed code to GitHub? (Y/N)"

    if ($answer -notmatch '^[Yy]$') {
        Cancel-Checker "PUSH cancelled by user."
    }

    git push origin $ExpectedBranch

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "PUSH failed. Your local commits remain safe on this computer."
    }
}

# Uncommitted/new work while committed history matches.
if ($ahead -eq 0 -and $behind -eq 0 -and
    ($unstaged.Count -gt 0 -or
     $staged.Count -gt 0 -or
     $realUntracked.Count -gt 0)) {

    Write-Host ""
    Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
    Write-Host " LOCAL WORK DETECTED" -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""

    if ($unstaged.Count -gt 0) {
        Write-Host "TRACKED MODIFICATIONS:" -ForegroundColor Cyan
        $unstaged | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
    }

    if ($staged.Count -gt 0) {
        Write-Host "ALREADY STAGED:" -ForegroundColor Cyan
        $staged | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
    }

    if ($realUntracked.Count -gt 0) {
        Write-Host "NEW FILES:" -ForegroundColor Cyan
        $realUntracked | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
    }

    if ($backupFiles.Count -gt 0) {
        Write-Host "$($backupFiles.Count) .before-* backup file(s) will NOT be included." -ForegroundColor DarkGray
        Write-Host ""
    }

    Write-Host "WHAT THIS MEANS:" -ForegroundColor Cyan
    Write-Host "This computer contains work that is not yet on GitHub."
    Write-Host ""
    Write-Host "RECOMMENDED ACTION:" -ForegroundColor Green
    Write-Host "If you finished this coding session, PUSH it now." -ForegroundColor Green
    Write-Host ""
    Write-Host ">>> RECOMMENDATION: CHOOSE Y IF YOU ARE DONE CODING <<<" -ForegroundColor Green
    Write-Host ""

    $answer = Read-Host "Commit and PUSH this local work to GitHub? (Y/N)"

    if ($answer -notmatch '^[Yy]$') {
        Cancel-Checker "PUSH cancelled by user."
    }

    # Fetch again immediately before creating a commit.
    git fetch origin

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "Final GitHub safety check failed. Nothing was committed."
    }

    $preCounts = (git rev-list --left-right --count HEAD...origin/$ExpectedBranch).Trim() -split '\s+'

    if ([int]$preCounts[1] -gt 0) {
        Stop-Checker "GitHub changed while the checker was running. Nothing was committed."
    }

    # Stage tracked changes only.
    git add -u

    # Add real new files explicitly, but never .before-* backups.
    foreach ($file in $realUntracked) {
        git add -- $file
    }

    Write-Host ""
    Write-Host "FILES TO COMMIT:" -ForegroundColor Cyan
    git --no-pager diff --cached --name-status
    Write-Host ""

    $message = Read-Host "Commit message (ENTER = My Life V2 synchronization checkpoint)"

    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "My Life V2 synchronization checkpoint"
    }

    git commit -m $message

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "Commit failed. PUSH was not attempted."
    }

    # Fetch once more before push.
    git fetch origin

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "Could not perform final pre-PUSH GitHub check. Local commit remains safe."
    }

    $prePushCounts = (git rev-list --left-right --count HEAD...origin/$ExpectedBranch).Trim() -split '\s+'

    if ([int]$prePushCounts[1] -gt 0) {
        Stop-Checker "GitHub received newer work before this PUSH. Local commit is safe; automatic PUSH blocked."
    }

    git push origin $ExpectedBranch

    if ($LASTEXITCODE -ne 0) {
        Stop-Checker "PUSH failed. Local commit remains safe on this computer."
    }
}

Write-Host "[8/8] Final verification..." -ForegroundColor Cyan

git fetch origin

if ($LASTEXITCODE -ne 0) {
    Stop-Checker "Final GitHub verification failed."
}

$local  = (git rev-parse HEAD).Trim()
$remote = (git rev-parse origin/$ExpectedBranch).Trim()

$finalUnstaged = @(git diff --name-only)
$finalStaged   = @(git diff --cached --name-only)

Write-Host ""
Write-Host "LOCAL  : $local"
Write-Host "GITHUB : $remote"

if ($local -ne $remote) {
    Stop-Checker "Final commit verification failed. This PC and GitHub do not match."
}

if ($finalUnstaged.Count -gt 0 -or $finalStaged.Count -gt 0) {
    Stop-Checker "Tracked local changes still exist after synchronization."
}

Success

