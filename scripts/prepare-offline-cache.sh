#!/usr/bin/env bash
# ==============================================================================
# Helper Script: Prepare Offline Packages Cache for Ubuntu AMD64
# Run this script on an internet-connected Ubuntu AMD64 machine to download
# all .deb packages required to install the Wi-Fi Dashboard completely offline.
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  Preparing Offline .deb Package Cache for Ubuntu AMD64         ${NC}"
echo -e "${CYAN}================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$SCRIPT_DIR/offline-packages"

mkdir -p "$CACHE_DIR"
cd "$CACHE_DIR"

echo -e "${YELLOW}Downloading .deb packages for offline AMD64 installation...${NC}"

PACKAGES=(
    hostapd
    dnsmasq
    dnsmasq-base
    nftables
    libnftables1
    iw
    rfkill
    iproute2
    usbutils
    pciutils
    ethtool
)

for pkg in "${PACKAGES[@]}"; do
    echo "Fetching $pkg..."
    apt-get download "$pkg" 2>/dev/null || echo -e "${YELLOW}Notice: $pkg might already be satisfied by base Ubuntu or unavailable.${NC}"
done

DEB_COUNT=$(ls -1 *.deb 2>/dev/null | wc -l)
echo -e "\n${GREEN}[SUCCESS] Downloaded ${DEB_COUNT} .deb package(s) into ${CACHE_DIR}.${NC}"
echo -e "You can now copy the entire project directory (including offline-packages) to your offline Ubuntu Desktop machine and run: sudo ./offline-install.sh"
