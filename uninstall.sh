#!/usr/bin/env bash
# ==============================================================================
# Uninstaller for Linux AMD64 Wi-Fi Repeater & AP Management Dashboard
# Safely reverts all networking changes and leaves system firewall/NM intact.
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: Must be run with sudo or as root.${NC}"
    exit 1
fi

echo -e "${YELLOW}================================================================${NC}"
echo -e "${YELLOW}  Wi-Fi Repeater & AP Dashboard Uninstaller                     ${NC}"
echo -e "${YELLOW}================================================================${NC}"
echo "This will:"
echo " 1. Stop and disable the wifi-dashboard service"
echo " 2. Stop hostapd and dnsmasq instances launched by the dashboard"
echo " 3. Remove ONLY the application's isolated nftables NAT table"
echo " 4. Remove /opt/wifi-dashboard, /etc/wifi-dashboard, and sudoers rules"
echo " 5. Leave all system connections, NetworkManager, and UFW intact"
echo ""

read -rp "Are you sure you want to proceed? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo -e "\nStopping and disabling services..."
systemctl stop wifi-dashboard.service 2>/dev/null || true
systemctl disable wifi-dashboard.service 2>/dev/null || true
rm -f /etc/systemd/system/wifi-dashboard.service
systemctl daemon-reload

# Stop hostapd/dnsmasq instances safely
killall hostapd 2>/dev/null || true
killall dnsmasq 2>/dev/null || true

# Remove ONLY the application's isolated NAT table
echo "Removing isolated nftables table 'inet wifi_dashboard_nat'..."
if command -v nft >/dev/null 2>&1; then
    nft delete table inet wifi_dashboard_nat 2>/dev/null || true
fi

# Remove sudoers rule
rm -f /etc/sudoers.d/010_wifi-dashboard

# Remove application files
echo "Removing application files..."
rm -rf /opt/wifi-dashboard
rm -rf /etc/wifi-dashboard

echo -e "\n${GREEN}[SUCCESS] Wi-Fi Dashboard has been cleanly uninstalled.${NC}"
echo "Your primary network connections and system firewall remain completely undisturbed."
