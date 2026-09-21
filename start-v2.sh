#!/usr/bin/env bash

set -u

PROJECT_DIR="/home/michaum/Development/Projects/My-Life"

if [ ! -d "$PROJECT_DIR/.git" ]; then
    clear

    printf '%s\n' "============================================================"
    printf '\033[31m%s\033[0m\n' "             MY LIFE V2 - DEVELOPMENT BLOCKED"
    printf '%s\n\n' "============================================================"

    echo "Developer : Marcel"
    echo "Machine   : NOBARA HOME PC"
    echo "Project   : My Life V2"
    echo

    printf '\033[31m%s\033[0m\n' "PROJECT FOLDER NOT FOUND"
    echo "$PROJECT_DIR"
    echo

    printf '%s\n' "============================================================"
    printf '\033[31m%s\033[0m\n' "                 NOT READY TO CODE"
    printf '%s\n\n' "============================================================"

    exec bash
fi

cd "$PROJECT_DIR" || exit 1

node scripts/preflight-v2.mjs
PREFLIGHT_STATUS=$?

if [ "$PREFLIGHT_STATUS" -ne 0 ]; then
    echo

    printf '%s\n' "============================================================"
    printf '\033[31m%s\033[0m\n' "             MY LIFE V2 - DEVELOPMENT BLOCKED"
    printf '%s\n\n' "============================================================"

    echo "Developer : Marcel"
    echo "Machine   : NOBARA HOME PC"
    echo "Project   : My Life V2"
    echo

    printf '\033[31m%s\033[0m\n\n' "PREFLIGHT FAILED - DO NOT START DEVELOPMENT"
    printf '\033[31m%s\033[0m\n\n' "Fix the issue reported above before changing code."

    printf '%s\n' "============================================================"
    printf '\033[31m%s\033[0m\n' "                 NOT READY TO CODE"
    printf '%s\n\n' "============================================================"

    cd "$PROJECT_DIR"
    exec bash
fi

BRANCH="$(git branch --show-current)"
COMMIT="$(git rev-parse --short HEAD)"
NODE_VERSION="$(node --version)"
NPM_VERSION="$(npm --version)"

clear

printf '%s\n' "============================================================"
printf '\033[32m%s\033[0m\n' "              MY LIFE V2 - DEVELOPMENT READY"
printf '%s\n\n' "============================================================"

echo "Developer : Marcel"
echo "Machine   : NOBARA HOME PC"
echo "Project   : My Life V2"
echo "Branch    : $BRANCH"
echo "Commit    : $COMMIT"
echo "Node      : $NODE_VERSION"
echo "npm       : $NPM_VERSION"
echo
echo "Repository: $PROJECT_DIR"
printf '\033[32m%s\033[0m\n\n' "PREFLIGHT : PASSED"

printf '%s\n' "============================================================"
printf '\033[32m%s\033[0m\n' "                 READY TO CODE"
printf '%s\n\n' "============================================================"

cd "$PROJECT_DIR"
exec bash
