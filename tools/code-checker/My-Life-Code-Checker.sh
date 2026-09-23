#!/usr/bin/env bash

set -u

REPO="/home/michaum/Development/Projects/My-Life"
BRANCH="v2-redesign"
REMOTE="https://github.com/michaum/My-Life.git"
COMPUTER="NOBARA HOME"

export GIT_PAGER=cat
export PAGER=cat

red='\033[0;31m'
green='\033[0;32m'
yellow='\033[1;33m'
cyan='\033[0;36m'
magenta='\033[0;35m'
gray='\033[0;90m'
reset='\033[0m'

pause_close() {
    echo
    read -r -p "Press ENTER to close..."
}

stop_checker() {
    echo
    printf "${red}==========================================================${reset}\n"
    printf "${red}                       STOP${reset}\n"
    printf "${red}==========================================================${reset}\n"
    echo
    printf "${red}%s${reset}\n" "$1"
    echo
    printf "${yellow}RECOMMENDATION: Do not continue synchronization.${reset}\n"
    printf "${yellow}Nothing destructive was performed.${reset}\n"
    echo
    pause_close
    exit 1
}

cancel_checker() {
    echo
    printf "${yellow}==========================================================${reset}\n"
    printf "${yellow}              CANCELLED - NOTHING CHANGED${reset}\n"
    printf "${yellow}==========================================================${reset}\n"
    echo
    printf "${yellow}You chose not to continue.${reset}\n"
    printf "${green}Your existing files remain untouched.${reset}\n"
    echo
    pause_close
    exit 0
}

success() {
    echo
    printf "${green}==========================================================${reset}\n"
    printf "${green}                 ALL CHECKS PASSED${reset}\n"
    echo
    printf "${green}                THIS PC = GITHUB${reset}\n"
    printf "${green}                AHEAD   : 0${reset}\n"
    printf "${green}                BEHIND  : 0${reset}\n"
    echo
    printf "${green}>>> RECOMMENDATION: NO ACTION REQUIRED <<<${reset}\n"
    echo
    printf "${green}Safe to start coding.${reset}\n"
    printf "${green}Safe to close this computer.${reset}\n"
    printf "${green}Safe to continue on the other computer.${reset}\n"
    printf "${green}==========================================================${reset}\n"
    pause_close
    exit 0
}

clear

printf "${magenta}==========================================================${reset}\n"
printf "              MY-LIFE CODE CHECKER\n"
printf "${magenta}==========================================================${reset}\n"
echo
printf "${cyan} COMPUTER : %s${reset}\n" "$COMPUTER"
printf "${cyan} PROJECT  : My Life V2.0${reset}\n"
printf "${cyan} BRANCH   : %s${reset}\n" "$BRANCH"
echo

printf "${cyan}[1/8] Checking repository...${reset}\n"

[ -d "$REPO" ] || stop_checker "Repository not found: $REPO"

cd "$REPO" || stop_checker "Could not open repository."

inside="$(git rev-parse --is-inside-work-tree 2>/dev/null)" ||
    stop_checker "This folder is not a valid Git repository."

[ "$inside" = "true" ] ||
    stop_checker "This folder is not a valid Git repository."

printf "${green}      PASS${reset}\n"

printf "${cyan}[2/8] Checking GitHub remote...${reset}\n"

remote="$(git remote get-url origin 2>/dev/null)" ||
    stop_checker "Could not determine GitHub remote."

[ "$remote" = "$REMOTE" ] ||
    stop_checker "Wrong GitHub repository.
Expected: $REMOTE
Found:    $remote"

printf "${green}      PASS${reset}\n"

printf "${cyan}[3/8] Checking branch...${reset}\n"

current_branch="$(git branch --show-current)"

[ "$current_branch" = "$BRANCH" ] ||
    stop_checker "Wrong branch.
Expected: $BRANCH
Found:    $current_branch"

printf "${green}      PASS${reset}\n"

printf "${cyan}[4/8] Contacting GitHub...${reset}\n"

git fetch origin --prune ||
    stop_checker "Could not contact GitHub.

Check your Internet connection and GitHub authentication."

printf "${green}      PASS${reset}\n"

printf "${cyan}[5/8] Inspecting local work...${reset}\n"

mapfile -t unstaged < <(git diff --name-only)
mapfile -t staged < <(git diff --cached --name-only)
mapfile -t all_untracked < <(git ls-files --others --exclude-standard)

backup_files=()
real_untracked=()

for file in "${all_untracked[@]}"; do
    if [[ "$file" =~ \.before-[^/]+$ ]]; then
        backup_files+=("$file")
    else
        real_untracked+=("$file")
    fi
done

printf "      Tracked modified : %s\n" "${#unstaged[@]}"
printf "      Staged           : %s\n" "${#staged[@]}"
printf "      New files        : %s\n" "${#real_untracked[@]}"
printf "${gray}      Local backups    : %s${reset}\n" "${#backup_files[@]}"

printf "${cyan}[6/8] Comparing this PC with GitHub...${reset}\n"

read -r ahead behind < <(
    git rev-list --left-right --count HEAD..."origin/$BRANCH"
)

printf "      Local ahead  : %s\n" "$ahead"
printf "      Local behind : %s\n" "$behind"

printf "${cyan}[7/8] Determining safe action...${reset}\n"

if (( ahead > 0 && behind > 0 )); then
    stop_checker "Both this computer and GitHub contain different newer commits.

LOCAL AHEAD : $ahead
LOCAL BEHIND: $behind

WHAT THIS MEANS:
Work was committed independently on both sides.

RECOMMENDATION:
Do NOT PUSH and do NOT GET.
Have the differences reviewed first."
fi

if (( behind > 0 )); then

    if (( ${#unstaged[@]} > 0 ||
          ${#staged[@]} > 0 ||
          ${#real_untracked[@]} > 0 )); then

        stop_checker "GitHub has newer code, but this computer also contains local work.

WHAT THIS MEANS:
Getting GitHub now could interfere with unfinished local work.

RECOMMENDATION:
Do NOT GET or PUSH yet.
Review the local work first."
    fi

    echo
    printf "${yellow}==========================================================${reset}\n"
    printf "${yellow}                 GITHUB IS NEWER${reset}\n"
    printf "${yellow}==========================================================${reset}\n"
    echo
    echo "GitHub is $behind commit(s) newer than this computer."
    echo
    echo "WHAT THIS MEANS:"
    echo "You probably worked on the other computer and pushed"
    echo "those changes to GitHub."
    echo
    printf "${green}RECOMMENDED ACTION:${reset}\n"
    printf "${green}GET the newer files before you start coding.${reset}\n"
    echo
    printf "${green}>>> RECOMMENDATION: CHOOSE Y <<<${reset}\n"
    echo

    read -r -p "GET newest code from GitHub? (Y/N): " answer

    [[ "$answer" =~ ^[Yy]$ ]] || cancel_checker

    git pull --ff-only origin "$BRANCH" ||
        stop_checker "GET failed.

No automatic merge was attempted."
fi

if (( ahead > 0 && behind == 0 )); then
    echo
    printf "${yellow}==========================================================${reset}\n"
    printf "${yellow}              THIS COMPUTER IS NEWER${reset}\n"
    printf "${yellow}==========================================================${reset}\n"
    echo
    echo "This computer has $ahead committed change(s)"
    echo "that GitHub does not have."
    echo
    echo "WHAT THIS MEANS:"
    echo "Your committed work has not been uploaded yet."
    echo
    printf "${green}RECOMMENDED ACTION:${reset}\n"
    printf "${green}PUSH it to GitHub before leaving this computer.${reset}\n"
    echo
    printf "${green}>>> RECOMMENDATION: CHOOSE Y <<<${reset}\n"
    echo

    read -r -p "PUSH committed code to GitHub? (Y/N): " answer

    [[ "$answer" =~ ^[Yy]$ ]] || cancel_checker

    git push origin "$BRANCH" ||
        stop_checker "PUSH failed.

Your local commits remain safe on this computer."
fi

if (( ahead == 0 && behind == 0 )) &&
   (( ${#unstaged[@]} > 0 ||
      ${#staged[@]} > 0 ||
      ${#real_untracked[@]} > 0 )); then

    echo
    printf "${yellow}==========================================================${reset}\n"
    printf "${yellow}                 LOCAL WORK DETECTED${reset}\n"
    printf "${yellow}==========================================================${reset}\n"
    echo

    if (( ${#unstaged[@]} > 0 )); then
        printf "${cyan}TRACKED MODIFICATIONS:${reset}\n"
        printf '  %s\n' "${unstaged[@]}"
        echo
    fi

    if (( ${#staged[@]} > 0 )); then
        printf "${cyan}ALREADY STAGED:${reset}\n"
        printf '  %s\n' "${staged[@]}"
        echo
    fi

    if (( ${#real_untracked[@]} > 0 )); then
        printf "${cyan}NEW FILES:${reset}\n"
        printf '  %s\n' "${real_untracked[@]}"
        echo
    fi

    if (( ${#backup_files[@]} > 0 )); then
        printf "${gray}%s .before-* backup file(s) will NOT be included.${reset}\n" \
            "${#backup_files[@]}"
        echo
    fi

    echo "WHAT THIS MEANS:"
    echo "This computer contains work that is not yet on GitHub."
    echo
    printf "${green}RECOMMENDED ACTION:${reset}\n"
    printf "${green}If you finished this coding session, PUSH it now.${reset}\n"
    echo
    printf "${green}>>> RECOMMENDATION: CHOOSE Y IF YOU ARE DONE CODING <<<${reset}\n"
    echo

    read -r -p "Commit and PUSH this local work to GitHub? (Y/N): " answer

    [[ "$answer" =~ ^[Yy]$ ]] || cancel_checker

    git fetch origin ||
        stop_checker "Final GitHub safety check failed."

    read -r pre_ahead pre_behind < <(
        git rev-list --left-right --count HEAD..."origin/$BRANCH"
    )

    (( pre_behind == 0 )) ||
        stop_checker "GitHub changed while the checker was running.

Nothing was committed."

    git add -u

    for file in "${real_untracked[@]}"; do
        git add -- "$file"
    done

    echo
    printf "${cyan}FILES TO COMMIT:${reset}\n"
    git --no-pager diff --cached --name-status
    echo

    read -r -p \
        "Commit message (ENTER = My Life V2 synchronization checkpoint): " \
        message

    if [ -z "$message" ]; then
        message="My Life V2 synchronization checkpoint"
    fi

    git commit -m "$message" ||
        stop_checker "Commit failed. PUSH was not attempted."

    git fetch origin ||
        stop_checker "Final pre-PUSH GitHub check failed.

Your local commit remains safe."

    read -r push_ahead push_behind < <(
        git rev-list --left-right --count HEAD..."origin/$BRANCH"
    )

    (( push_behind == 0 )) ||
        stop_checker "GitHub received newer work before this PUSH.

Your local commit is safe.
Automatic PUSH has been blocked."

    git push origin "$BRANCH" ||
        stop_checker "PUSH failed.

Your local commit remains safe on this computer."
fi

printf "${cyan}[8/8] Final verification...${reset}\n"

git fetch origin ||
    stop_checker "Final GitHub verification failed."

local_commit="$(git rev-parse HEAD)"
remote_commit="$(git rev-parse "origin/$BRANCH")"

echo
echo "LOCAL  : $local_commit"
echo "GITHUB : $remote_commit"

[ "$local_commit" = "$remote_commit" ] ||
    stop_checker "Final commit verification failed.

This computer and GitHub do not match."

mapfile -t final_unstaged < <(git diff --name-only)
mapfile -t final_staged < <(git diff --cached --name-only)

if (( ${#final_unstaged[@]} > 0 ||
      ${#final_staged[@]} > 0 )); then
    stop_checker "Tracked local changes still exist after synchronization."
fi

success
