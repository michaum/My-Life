#!/usr/bin/env bash
set -euo pipefail

EXPECTED_BRANCH="v2-redesign"

echo "===== MY LIFE V2 SAFE SYNC ====="

CURRENT_BRANCH="$(git branch --show-current)"

if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
    echo "STOPPED: Current branch is '$CURRENT_BRANCH'."
    echo "Expected branch: '$EXPECTED_BRANCH'."
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "STOPPED: This computer has uncommitted changes."
    echo "Commit or resolve them before syncing."
    git status -sb
    exit 1
fi

echo "Fetching GitHub..."
git fetch origin

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse "origin/$EXPECTED_BRANCH")"
BASE="$(git merge-base HEAD "origin/$EXPECTED_BRANCH")"

if [[ "$LOCAL" == "$REMOTE" ]]; then
    echo "SAFE: This computer and GitHub already match."
elif [[ "$LOCAL" == "$BASE" ]]; then
    echo "GitHub is newer. Updating this computer safely..."
    git merge --ff-only "origin/$EXPECTED_BRANCH"
    echo "SAFE: This computer is now up to date."
elif [[ "$REMOTE" == "$BASE" ]]; then
    echo "SAFE: This computer has commits that are not yet on GitHub."
    echo "Push them when you are ready."
else
    echo "STOPPED: Local and GitHub histories have diverged."
    echo "Manual reconciliation is required. Nothing was overwritten."
    exit 1
fi

echo
git status -sb
