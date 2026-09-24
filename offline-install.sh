#!/usr/bin/env bash
# ==============================================================================
# Offline Installer for Linux AMD64 Wi-Fi Repeater & AP Management Dashboard
# Target Platform: Ubuntu 22.04 LTS / 24.04 LTS Desktop (AMD64 / x86_64)
# Designed for 100% Offline / Air-Gapped execution without internet access
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${CYAN}  Linux AMD64 Wi-Fi Dashboard - OFFLINE Installer (Ubuntu Desktop)${NC}"
echo -e "${BLUE}================================================================${NC}"

# Step 1: Verify Root Privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This installer must be executed with sudo privileges.${NC}"
    echo "Usage: sudo ./offline-install.sh"
    exit 1
fi

# Step 2: Validate Target Architecture AMD64 (x86_64)
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
    echo -e "${RED}[ERROR] Unsupported CPU architecture: $ARCH.${NC}"
    echo -e "This offline build is specifically compiled for AMD64 (x86_64) Linux."
    exit 1
fi
echo -e "${GREEN}[PASS]${NC} Architecture verified: AMD64 (x86_64)"

# Step 3: Detect Ubuntu Release
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "${GREEN}[PASS]${NC} Detected Linux Distribution: $PRETTY_NAME"
else
    echo -e "${YELLOW}[WARN]${NC} /etc/os-release not detected. Continuing with standard Debian/Ubuntu layout."
fi

# Step 4: Verify Offline Package Dependencies
echo -e "\n${BLUE}[1/7] Auditing required Linux networking utilities...${NC}"
REQUIRED_COMMANDS=("iw" "rfkill" "ip" "hostapd" "dnsmasq")
MISSING_COMMANDS=()

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $cmd is installed ($(command -v "$cmd"))"
    else
        echo -e "  ${YELLOW}✗${NC} $cmd is MISSING"
        MISSING_COMMANDS+=("$cmd")
    fi
done

# Check modern packet filter (nftables preferred, iptables accepted)
if command -v nft >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} nftables is installed ($(command -v nft))"
elif command -v iptables >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} iptables fallback is installed ($(command -v iptables))"
else
    echo -e "  ${YELLOW}✗${NC} nftables/iptables is MISSING"
    MISSING_COMMANDS+=("nftables")
fi

# Check Node.js runtime for the web server
if command -v node >/dev/null 2>&1 || command -v nodejs >/dev/null 2>&1; then
    NODE_BIN=$(command -v node || command -v nodejs)
    echo -e "  ${GREEN}✓${NC} Node.js runtime is installed ($NODE_BIN - $($NODE_BIN --version 2>/dev/null || echo 'ok'))"
else
    echo -e "  ${YELLOW}✗${NC} Node.js runtime is MISSING"
    MISSING_COMMANDS+=("nodejs")
fi

# If missing commands, attempt offline .deb package installation from cache
if [ ${#MISSING_COMMANDS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}[OFFLINE CACHE] Looking for offline Debian (.deb) packages...${NC}"
    DEB_DIR=""
    if [ -d "./offline-packages" ] && ls ./offline-packages/*.deb >/dev/null 2>&1; then
        DEB_DIR="./offline-packages"
    elif [ -d "./debs" ] && ls ./debs/*.deb >/dev/null 2>&1; then
        DEB_DIR="./debs"
    elif [ -d "/var/cache/apt/archives" ] && ls /var/cache/apt/archives/*.deb >/dev/null 2>&1; then
        DEB_DIR="/var/cache/apt/archives"
    fi

    if [ -n "$DEB_DIR" ]; then
        echo -e "${CYAN}Found offline package directory: $DEB_DIR${NC}"
        echo "Installing packages offline with dpkg..."
        dpkg -i --skip-same-version "$DEB_DIR"/*.deb || true
        echo -e "${GREEN}[OK]${NC} Offline package installation attempted."
    else
        echo -e "${YELLOW}[NOTICE] No offline .deb folder found.${NC}"
        echo -e "The following packages should be installed if not present: ${MISSING_COMMANDS[*]}"
        echo -e "You can prepare them on an internet-connected PC with: ./scripts/prepare-offline-cache.sh"
    fi
fi

# Step 5: Prevent default unconfigured daemons from failing on boot
echo -e "\n${BLUE}[2/7] Ensuring unconfigured system hostapd & dnsmasq do not clash...${NC}"
systemctl stop hostapd 2>/dev/null || true
systemctl disable hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
systemctl disable dnsmasq 2>/dev/null || true

# Step 6: Audit and Probe Universal USB Wi-Fi Hardware (In-Tree Drivers)
echo -e "\n${BLUE}[3/7] Probing connected Wi-Fi & USB wireless hardware...${NC}"
if [ -f "./scripts/detect-hw.sh" ]; then
    chmod +x ./scripts/detect-hw.sh
    ./scripts/detect-hw.sh || true
fi

# Try loading common in-tree USB wireless modules (offline native kernel)
for mod in rtw88_8821cu rtw88_8822cu mt76x2u mt76x0u mt7601u rt2800usb ath9k_htc carl9170 rtl8xxxu; do
    modprobe "$mod" 2>/dev/null || true
done
rfkill unblock wifi 2>/dev/null || true

# Step 7: Application Deployment Directories
APP_DIR="/opt/wifi-dashboard"
CONF_DIR="/etc/wifi-dashboard"
LOG_DIR="/var/log/wifi-dashboard"

echo -e "\n${BLUE}[4/7] Deploying application files to $APP_DIR...${NC}"
mkdir -p "$APP_DIR" "$CONF_DIR" "$LOG_DIR"

# Copy pre-built project files
cp -r . "$APP_DIR/"
cp -f config/hostapd.conf.template "$CONF_DIR/hostapd.conf"
cp -f config/dnsmasq.conf.template "$CONF_DIR/dnsmasq.conf"
cp -f config/nftables.rules.template "$CONF_DIR/nftables_nat.nft"

chmod +x "$APP_DIR"/scripts/*.sh 2>/dev/null || true
chmod +x "$APP_DIR"/*.sh 2>/dev/null || true

# Step 8: Verify Pre-Built Offline Application Assets
echo -e "\n${BLUE}[5/7] Verifying pre-built frontend & standalone server bundle...${NC}"
if [ -f "$APP_DIR/dist/index.html" ]; then
    echo -e "  ${GREEN}✓${NC} Pre-built web frontend verified ($APP_DIR/dist)"
else
    echo -e "  ${YELLOW}!${NC} dist/index.html not found. Checking if vite build can run locally..."
    if command -v npm >/dev/null 2>&1 && [ -d "$APP_DIR/node_modules" ]; then
        (cd "$APP_DIR" && npm run build) || true
    fi
fi

if [ -f "$APP_DIR/server.ts" ]; then
    echo -e "  ${GREEN}✓${NC} Node.js server entry point verified ($APP_DIR/server.ts)"
fi

# Step 9: Install Restricted Sudoers Policy
echo -e "\n${BLUE}[6/7] Installing restricted sudoers policy for secure root operations...${NC}"
mkdir -p /etc/sudoers.d
cp sudoers/010_wifi-dashboard /etc/sudoers.d/010_wifi-dashboard
chmod 0440 /etc/sudoers.d/010_wifi-dashboard

# Step 10: Install Systemd Service & Desktop Launchers
echo -e "\n${BLUE}[7/7] Configuring systemd service and Ubuntu Desktop shortcut...${NC}"

# Find Node executable
NODE_PATH="/usr/bin/node"
if command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
elif command -v nodejs >/dev/null 2>&1; then
    NODE_PATH=$(command -v nodejs)
fi

# Customize systemd unit to use the verified node path
sed -i "s|ExecStart=.*|ExecStart=${NODE_PATH} /opt/wifi-dashboard/server.ts|" systemd/wifi-dashboard.service
sed -i "s|Environment=PORT=.*|Environment=PORT=3000|" systemd/wifi-dashboard.service

cp systemd/wifi-dashboard.service /etc/systemd/system/wifi-dashboard.service
systemctl daemon-reload
systemctl enable wifi-dashboard.service
systemctl restart wifi-dashboard.service

# Create application menu launcher
mkdir -p /usr/share/applications
cat << 'EOF' > /usr/share/applications/wifi-dashboard.desktop
[Desktop Entry]
Name=Wi-Fi Repeater & AP Dashboard
Comment=Ubuntu AMD64 Wi-Fi Repeater & Access Point Manager
Exec=xdg-open http://127.0.0.1:3000
Icon=network-wireless
Terminal=false
Type=Application
Categories=Network;System;Settings;
EOF
chmod +x /usr/share/applications/wifi-dashboard.desktop

# If desktop folder exists for active user, create direct Desktop icon
if [ -n "${SUDO_USER:-}" ] && [ -d "/home/$SUDO_USER/Desktop" ]; then
    DESKTOP_FILE="/home/$SUDO_USER/Desktop/wifi-dashboard.desktop"
    cp /usr/share/applications/wifi-dashboard.desktop "$DESKTOP_FILE"
    chown "$SUDO_USER:$SUDO_USER" "$DESKTOP_FILE"
    chmod +x "$DESKTOP_FILE"
    
    # Trust desktop icon for GNOME 3/4 desktop
    if command -v gio >/dev/null 2>&1; then
        sudo -u "$SUDO_USER" gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
    fi
fi

# Completion Summary
sleep 1
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  OFFLINE INSTALLATION COMPLETE! Dashboard is now running.    ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Access your Wi-Fi Management Dashboard locally at:"
echo -e "  ${CYAN}http://127.0.0.1:3000${NC}"
echo -e ""
echo -e "Ubuntu Desktop Shortcuts:"
echo -e "  - Applications Menu -> ${CYAN}Wi-Fi Repeater & AP Dashboard${NC}"
if [ -n "${SUDO_USER:-}" ] && [ -d "/home/$SUDO_USER/Desktop" ]; then
    echo -e "  - Desktop Icon -> ${CYAN}~/Desktop/wifi-dashboard.desktop${NC}"
fi
echo -e ""
echo -e "Service Management Commands:"
echo -e "  - View live status: ${YELLOW}systemctl status wifi-dashboard.service${NC}"
echo -e "  - View live logs:   ${YELLOW}journalctl -u wifi-dashboard.service -f${NC}"
echo -e "  - Restart service:  ${YELLOW}sudo systemctl restart wifi-dashboard.service${NC}"
echo -e "${BLUE}================================================================${NC}"
