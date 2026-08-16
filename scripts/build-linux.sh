#!/usr/bin/env bash
#
# Build the Tome Tauri shell as a native Linux package — a .deb (and an AppImage when
# the bundler's tooling resolves). Runs on Linux or WSL2 (Ubuntu 22.04+, webkit2gtk-4.1).
#
# Prerequisites (install once):
#   sudo apt install libwebkit2gtk-4.1-dev libsoup-3.0-dev libgtk-3-dev \
#        librsvg2-dev build-essential libayatana-appindicator3-dev \
#        libssl-dev patchelf file curl wget
#   Rust toolchain (https://rustup.rs). For the frontend build you also need Node;
#   without Node, prebuild dist/ on any platform (`npm run build`) and this script reuses it.
#
# Usage (from the repo root):  scripts/build-linux.sh
#
# WSL note: build in the Linux-native filesystem (or export CARGO_TARGET_DIR to a Linux
# path) so the Linux target/ never collides with a Windows-built src-tauri/target/ on
# /mnt/c (and to avoid 9p slowness). Provisioning the apt packages above is a local,
# one-time host action — a requirement, not part of the repo. .rpm is a documented
# follow-up (needs rpmbuild); this script targets .deb + AppImage.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
  echo "error: webkit2gtk-4.1 dev package not found — install the prerequisites (see header)." >&2
  exit 1
fi

# Reuse a prebuilt dist/, else build it if Node is available.
if [ ! -d dist ]; then
  if command -v npm >/dev/null 2>&1; then
    echo "no dist/ — building the frontend …"; npm run build
  else
    echo "error: no dist/ and no Node to build it; prebuild dist/ elsewhere (npm run build)." >&2
    exit 1
  fi
fi

# Tauri CLI as a cargo subcommand (no Node needed for bundling).
if ! cargo tauri --version >/dev/null 2>&1; then
  echo "installing tauri-cli (cargo) …"; cargo install tauri-cli --version "^2" --locked
fi

# .deb is the guaranteed artifact (criterion 1); AppImage is best-effort (its bundler
# fetches linuxdeploy/appimagetool over the network). Kept as separate invocations so a
# failed AppImage fetch never loses the .deb.
echo "building .deb …"
cargo tauri build --bundles deb
echo "building AppImage (best-effort) …"
cargo tauri build --bundles appimage || echo "note: AppImage skipped/failed (tooling/network); .deb is the primary artifact."

echo
echo "Linux bundle(s):"
find "${CARGO_TARGET_DIR:-src-tauri/target}"/release/bundle -maxdepth 2 -type f \
  \( -name '*.deb' -o -name '*.AppImage' \) -printf '  %p (%s bytes)\n' 2>/dev/null || true
