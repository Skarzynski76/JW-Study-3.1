#!/usr/bin/env bash
set -euo pipefail
node "$(dirname "$0")/regresja.js" "${1:-$(dirname "$0")/../index.html}"
