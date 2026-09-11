#!/usr/bin/env bash
# Atomically publish the freshly-built static site (apps/web/dist) into the
# directory nginx serves: PUBLISH_DIR/current -> PUBLISH_DIR/releases/<ts>.
# Zero-downtime: a new release is copied in full, then the `current` symlink is
# swapped with an atomic rename. Old releases are pruned (keep PUBLISH_KEEP).
set -euo pipefail

: "${PUBLISH_DIR:?PUBLISH_DIR must be set (the dir nginx serves; holds current/ and releases/)}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/apps/web/dist"
KEEP="${PUBLISH_KEEP:-5}"

[ -d "$SRC" ] || { echo "swap-dist: no build at $SRC — run the build first" >&2; exit 1; }

releases="$PUBLISH_DIR/releases"
ts="$(date +%Y%m%d%H%M%S)"
dest="$releases/$ts"

mkdir -p "$dest"
cp -a "$SRC/." "$dest/"

# Atomic swap: point a temp symlink at the new release, then rename it over
# current/ (rename is atomic on the same filesystem).
ln -sfn "$dest" "$PUBLISH_DIR/.current.tmp"
mv -Tf "$PUBLISH_DIR/.current.tmp" "$PUBLISH_DIR/current"

# Prune old releases, keeping the newest $KEEP.
ls -1dt "$releases"/*/ 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -rf

echo "swap-dist: published $ts -> $PUBLISH_DIR/current"
