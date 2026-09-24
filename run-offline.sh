#!/usr/bin/env bash
# ==============================================================================
# Standalone Offline Launcher for Ubuntu Desktop AMD64
# Runs the Wi-Fi Dashboard locally on port 3000 and opens the web browser
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  Linux AMD64 Wi-Fi Dashboard - Standalone Offline Launcher     ${NC}"
echo -e "${CYAN}================================================================${NC}"

# Find Node.js
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
    NODE_BIN=$(command -v node)
elif command -v nodejs >/dev/null 2>&1; then
    NODE_BIN=$(command -v nodejs)
else
    echo -e "${RED}[ERROR] Node.js runtime not found on this machine.${NC}"
    echo "Please ensure Node.js is installed or run: sudo ./offline-install.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verify pre-built web assets
if [ ! -f "dist/index.html" ]; then
    echo -e "${YELLOW}[WARN] Pre-built dist/index.html not found.${NC}"
    if command -v npm >/dev/null 2>&1 && [ -d "node_modules" ]; then
        echo "Building frontend locally with npm run build..."
        npm run build
    fi
fi

# Locate server executable
SERVER_FILE=""
if [ -f "server.js" ]; then
    SERVER_FILE="server.js"
elif [ -f "dist-server/server.mjs" ]; then
    SERVER_FILE="dist-server/server.mjs"
else
    SERVER_FILE="server.ts"
fi

export PORT=3000
export NODE_ENV=production

echo -e "${GREEN}[OK]${NC} Starting Wi-Fi Dashboard on http://127.0.0.1:3000..."

# Open browser in background if display is available
if [ -n "${DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then
    (sleep 1.5 && xdg-open http://127.0.0.1:3000 >/dev/null 2>&1) &
fi

if command -v node >/dev/null 2>&1 && node --version | grep -Eq "v(2[2-9]|[3-9])"; then
    exec "$NODE_BIN" "$SERVER_FILE"
elif command -v tsx >/dev/null 2>&1; then
    exec tsx "$SERVER_FILE"
elif command -v npx >/dev/null 2>&1; then
    exec npx tsx "$SERVER_FILE"
else
    exec "$NODE_BIN" "$SERVER_FILE"
fi
