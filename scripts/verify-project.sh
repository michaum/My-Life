#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "========================================"
echo " My Life project verification"
echo "========================================"

fail() {
  echo
  echo "❌ VERIFY FAILED: $1"
  exit 1
}

echo
echo "1. Checking Web/Windows versions..."

PACKAGE_VERSION="$(node -p 'require("./package.json").version')"
TAURI_VERSION="$(node -p 'require("./src-tauri/tauri.conf.json").version')"

echo "   package.json:      $PACKAGE_VERSION"
echo "   tauri.conf.json:   $TAURI_VERSION"

[[ "$PACKAGE_VERSION" == "$TAURI_VERSION" ]] || \
  fail "Web and Windows versions do not match."

echo "   ✅ Versions match"

echo
echo "2. Checking weekly recurrence support..."

grep -q 'z.enum(\["none", "days", "weeks", "months", "years"\])' \
  app/api/workspace/route.ts || \
  fail 'Workspace API recurrence enum does not include "weeks".'

grep -q '"none" | "days" | "weeks" | "months" | "years"' \
  app/page.tsx || \
  fail 'Task recurrence type does not include "weeks".'

echo "   ✅ Weekly recurrence is supported in UI and API"

echo
echo "3. Checking shared database schema..."

normalize_sql() {
  sed \
    -e 's/--.*$//' \
    -e 's/[[:space:]]\+/ /g' \
    -e 's/^ *//' \
    -e 's/ *$//' \
    "$1" |
  tr '[:upper:]' '[:lower:]' |
  grep -v '^$'
}

TMP_WEB="$(mktemp)"
TMP_DESKTOP="$(mktemp)"
trap 'rm -f "$TMP_WEB" "$TMP_DESKTOP"' EXIT

for file in drizzle/*.sql; do
  normalize_sql "$file"
done | sort -u > "$TMP_WEB"

for file in src-tauri/migrations/*.sql; do
  case "$(basename "$file")" in
    0011_sync_queue.sql)
      # Desktop-only offline synchronization table.
      ;;
    *)
      normalize_sql "$file"
      ;;
  esac
done | sort -u > "$TMP_DESKTOP"

MISSING_WEB="$(comm -13 "$TMP_WEB" "$TMP_DESKTOP" || true)"
MISSING_DESKTOP="$(comm -23 "$TMP_WEB" "$TMP_DESKTOP" || true)"

if [[ -n "$MISSING_WEB" ]]; then
  echo
  echo "Statements present on Windows but missing from Web:"
  echo "$MISSING_WEB"
  fail "Shared database migrations are out of sync."
fi

if [[ -n "$MISSING_DESKTOP" ]]; then
  echo
  echo "Statements present on Web but missing from Windows:"
  echo "$MISSING_DESKTOP"
  fail "Shared database migrations are out of sync."
fi

echo "   ✅ Shared Web and Windows schema changes match"

echo
echo "4. Checking required recurrence columns..."

grep -Rqi 'add column recurrence_unit' drizzle || \
  fail "Web migration for recurrence_unit is missing."

grep -Rqi 'add column recurrence_interval' drizzle || \
  fail "Web migration for recurrence_interval is missing."

grep -Rqi 'add column recurrence_unit' src-tauri/migrations || \
  fail "Windows migration for recurrence_unit is missing."

grep -Rqi 'add column recurrence_interval' src-tauri/migrations || \
  fail "Windows migration for recurrence_interval is missing."

echo "   ✅ Recurrence columns exist in both migration sets"

echo
echo "5. Checking project sidebar font column..."

grep -Rqi 'add column sidebar_font_color' drizzle || \
  fail "Web migration for sidebar_font_color is missing."

grep -Rqi 'add column sidebar_font_color' src-tauri/migrations || \
  fail "Windows migration for sidebar_font_color is missing."

echo "   ✅ Sidebar font color exists in both migration sets"

echo
echo
echo "========================================"
echo "✅ PROJECT VERIFICATION PASSED"
echo "========================================"
