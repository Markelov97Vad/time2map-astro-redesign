#!/usr/bin/env bash
# Deploy new code on the server: pull/rebase, install, build (web + audit, server),
# atomically swap the static site into place, and restart the backend.
#
# Usage (on the server):
#   bash deploy/deploy.sh              # update from origin/<current-branch>
#   bash deploy/deploy.sh <git-ref>    # rebase onto a specific commit (e.g. GITHUB_SHA)
#
# Local content commits from Keystatic Publish are preserved (rebase, not reset).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TARGET_REF="${1:-}"
PUBLISH_DIR="${PUBLISH_DIR:-/var/www/time2map}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$BRANCH" == "HEAD" ]]; then
  echo "deploy: detached HEAD — check out master first" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "deploy: working tree is dirty; commit or stash before deploying" >&2
  git status --short >&2
  exit 1
fi

echo "==> git fetch"
git fetch --prune origin

if [[ -n "$TARGET_REF" ]]; then
  echo "==> rebase onto $TARGET_REF (keeps local content commits)"
  git rev-parse --verify "${TARGET_REF}^{commit}" >/dev/null
  git rebase "$TARGET_REF"
else
  echo "==> git pull --rebase origin $BRANCH"
  git pull --rebase --ff-only origin "$BRANCH"
fi

echo "==> npm ci"
npm ci

echo "==> build (web + SEO audit, then server)"
npm run build:all

echo "==> swap static into place"
PUBLISH_DIR="$PUBLISH_DIR" bash deploy/swap-dist.sh

echo "==> restart backend"
sudo systemctl restart time2map-server

echo "==> done ($(git rev-parse --short HEAD))"

