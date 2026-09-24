#!/usr/bin/env bash
# ==============================================================================
# Offline Release Bundle Generator for Ubuntu AMD64 Desktop
# Compiles frontend, packages standalone server, and generates an offline tarball
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  Building Self-Contained Offline AMD64 Release Package        ${NC}"
echo -e "${CYAN}================================================================${NC}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 1. Build Vite frontend
echo -e "\n${BLUE}[1/3] Compiling Vite React Frontend...${NC}"
npx vite build

# 2. Ensure permissions
echo -e "\n${BLUE}[2/3] Setting execution permissions...${NC}"
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x *.sh 2>/dev/null || true

# 3. Generate Tarball
echo -e "\n${BLUE}[3/3] Creating offline release archive...${NC}"
ARCHIVE_NAME="wifi-dashboard-amd64-offline.tar.gz"

tar --exclude='./.git' \
    --exclude='./node_modules' \
    --exclude='./.env' \
    --exclude="./$ARCHIVE_NAME" \
    -czvf "$ARCHIVE_NAME" .

if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$ARCHIVE_NAME" > "${ARCHIVE_NAME}.sha256"
fi

SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  Offline AMD64 Bundle Generated: ${ARCHIVE_NAME} (${SIZE})     ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "To install on your offline Ubuntu AMD64 machine:"
echo -e "  1. Transfer ${ARCHIVE_NAME} to your Ubuntu machine (USB drive, etc.)"
echo -e "  2. Extract: tar -xvf ${ARCHIVE_NAME}"
echo -e "  3. Run: sudo ./offline-install.sh"
