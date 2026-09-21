#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/michaum/Development/Projects/My-Life"

clear

echo "========================================"
echo "       STARTING MY LIFE V2"
echo "========================================"
echo

cd "$PROJECT_DIR"

node scripts/preflight-v2.mjs

echo
echo "========================================"
echo "   MY LIFE V2 IS READY FOR DEVELOPMENT"
echo "========================================"
echo
echo "Project: $PROJECT_DIR"
echo "Branch:  $(git branch --show-current)"
echo "Commit:  $(git rev-parse --short HEAD)"
echo
