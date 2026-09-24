#!/usr/bin/env bash
# ==============================================================================
# Installer for Linux AMD64 Wi-Fi Repeater & AP Management Dashboard
# Target Platform: Ubuntu 22.04 LTS / 24.04 LTS Desktop (AMD64 / x86_64)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  Linux AMD64 Wi-Fi Repeater & AP Management Dashboard Installer${NC}"
echo -e "${BLUE}================================================================${NC}"

# Check for root privilege
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run with sudo or as root.${NC}"
    echo "Usage: sudo ./install.sh"
    exit 1
fi

# Step 1: Detect Architecture
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
    echo -e "${RED}Error: Architecture $ARCH is not supported. This software requires AMD64 (x86_64).${NC}"
    exit 1
fi
echo -e "${GREEN}[PASS]${NC} Architecture AMD64 verified."

# Step 2: Detect Ubuntu Release
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" != "ubuntu" ] && [ "$ID_LIKE" != "ubuntu" ]; then
        echo -e "${YELLOW}[WARN]${NC} Detected OS is $PRETTY_NAME. Ubuntu 22.04/24.04 is officially recommended."
    else
        echo -e "${GREEN}[PASS]${NC} Detected OS: $PRETTY_NAME"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} Unable to verify OS release. Proceeding with caution."
fi

# Step 2.5: Auto-detect Offline Environment
OFFLINE_MODE=false
if [ "${1:-}" = "--offline" ]; then
    OFFLINE_MODE=true
elif ! ping -c 1 -W 2 1.1.1.1 >/dev/null 2>&1 && ! curl -s --connect-timeout 2 -I https://archive.ubuntu.com >/dev/null 2>&1; then
    OFFLINE_MODE=true
fi

if [ "$OFFLINE_MODE" = true ]; then
    echo -e "\n${YELLOW}[OFFLINE MODE] No internet connection detected or --offline flag passed.${NC}"
    echo -e "${CYAN}Switching seamlessly to offline installer (./offline-install.sh)...${NC}"
    if [ -f "./offline-install.sh" ]; then
        chmod +x ./offline-install.sh
        exec ./offline-install.sh "$@"
    fi
fi

# Step 3: Install Required Linux System Packages
echo -e "\n${BLUE}Updating package lists and installing dependencies...${NC}"
apt-get update -y
apt-get install -y \
    hostapd \
    dnsmasq \
    nftables \
    iw \
    rfkill \
    iproute2 \
    ethtool \
    network-manager \
    curl \
    nodejs \
    npm \
    usbutils \
    pciutils \
    dkms \
    build-essential

# Prevent default unconfigured hostapd/dnsmasq from failing on system boot
systemctl stop hostapd 2>/dev/null || true
systemctl disable hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
systemctl disable dnsmasq 2>/dev/null || true

# Step 4: Check NetworkManager
if systemctl is-active --quiet NetworkManager; then
    echo -e "${GREEN}[PASS]${NC} NetworkManager is active."
else
    echo -e "${YELLOW}[WARN]${NC} NetworkManager is not currently running. Primary Wi-Fi connection might use systemd-networkd."
fi

# Step 5: Hardware & Driver Audit
echo -e "\n${BLUE}Auditing Wireless Hardware & RTL8821C Support...${NC}"
./scripts/detect-hw.sh

# Step 6: Create Application Directories
APP_DIR="/opt/wifi-dashboard"
CONF_DIR="/etc/wifi-dashboard"
LOG_DIR="/var/log/wifi-dashboard"

echo -e "\n${BLUE}Setting up directories in $APP_DIR and $CONF_DIR...${NC}"
mkdir -p "$APP_DIR" "$CONF_DIR" "$LOG_DIR"

# Copy files
cp -r . "$APP_DIR/"
cp config/hostapd.conf.template "$CONF_DIR/hostapd.conf"
cp config/dnsmasq.conf.template "$CONF_DIR/dnsmasq.conf"
cp config/nftables.rules.template "$CONF_DIR/nftables_nat.nft"
chmod +x "$APP_DIR"/scripts/*.sh

# Step 7: Build Node.js Application
echo -e "\n${BLUE}Building web dashboard frontend & server...${NC}"
cd "$APP_DIR"
if [ ! -f "$APP_DIR/dist/index.html" ] || [ -f "$APP_DIR/package.json" ]; then
    npm install --include=dev --legacy-peer-deps || npm install --legacy-peer-deps || npm install --force || true
    if command -v npm >/dev/null 2>&1; then
        npm run build || true
    fi
fi

# Step 8: Install Restricted Sudoers Policy
echo -e "\n${BLUE}Installing restricted sudo policy...${NC}"
cp sudoers/010_wifi-dashboard /etc/sudoers.d/010_wifi-dashboard
chmod 0440 /etc/sudoers.d/010_wifi-dashboard

# Step 9: Install and Enable systemd Service
echo -e "\n${BLUE}Installing systemd service...${NC}"
cp systemd/wifi-dashboard.service /etc/systemd/system/wifi-dashboard.service
systemctl daemon-reload
systemctl enable wifi-dashboard.service
systemctl restart wifi-dashboard.service

# Step 10: Create Desktop Application Launcher
echo -e "\n${BLUE}Creating Ubuntu Desktop application launcher...${NC}"
mkdir -p /usr/share/applications
cat << 'EOF' > /usr/share/applications/wifi-dashboard.desktop
[Desktop Entry]
Name=Wi-Fi Repeater Dashboard
Comment=Ubuntu AMD64 Wi-Fi Repeater & Access Point Manager
Exec=xdg-open http://127.0.0.1:3000
Icon=network-wireless
Terminal=false
Type=Application
Categories=Network;System;Settings;
EOF
chmod +x /usr/share/applications/wifi-dashboard.desktop

# If user desktop directory exists, drop shortcut on desktop too
if [ -n "${SUDO_USER:-}" ] && [ -d "/home/$SUDO_USER/Desktop" ]; then
    cp /usr/share/applications/wifi-dashboard.desktop "/home/$SUDO_USER/Desktop/"
    chown "$SUDO_USER:$SUDO_USER" "/home/$SUDO_USER/Desktop/wifi-dashboard.desktop"
    chmod +x "/home/$SUDO_USER/Desktop/wifi-dashboard.desktop"
fi

# Step 11: Completion Summary & Tailscale Discovery
sleep 2
TAILSCALE_IP=""
if command -v tailscale >/dev/null 2>&1; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
fi

if systemctl is-active --quiet wifi-dashboard.service; then
    echo -e "\n${GREEN}================================================================${NC}"
    echo -e "${GREEN}  Installation Succeeded! Wi-Fi Dashboard is Running.${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo -e "Access your dashboard locally at:"
    echo -e "  ${BLUE}http://127.0.0.1:3000${NC}"
    if [ -n "$TAILSCALE_IP" ]; then
        echo -e "Access remotely via Tailscale at:"
        echo -e "  ${GREEN}http://${TAILSCALE_IP}:3000${NC}"
    else
        echo -e "To access remotely via Tailscale, run:"
        echo -e "  ${YELLOW}sudo tailscale up${NC}"
    fi
    echo -e "View service logs with:"
    echo -e "  ${YELLOW}journalctl -u wifi-dashboard.service -f${NC}"
else
    echo -e "${RED}Service did not start immediately. Check journalctl -u wifi-dashboard.service${NC}"
fi
