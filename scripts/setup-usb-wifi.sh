#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Repeater / AP Dashboard - Universal USB Wi-Fi Setup Utility
# Target: Ubuntu Desktop 22.04 / 24.04 LTS AMD64
# Configures and validates ANY USB Wi-Fi Dongle (Realtek, MediaTek, Atheros, etc.)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  Universal USB Wi-Fi Card Inspector & Validator for Ubuntu     ${NC}"
echo -e "${BLUE}================================================================${NC}"

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root (sudo ./scripts/setup-usb-wifi.sh)${NC}"
    exit 1
fi

echo -e "\n${BLUE}1. Scanning USB Bus (lsusb)...${NC}"
if ! command -v lsusb >/dev/null 2>&1; then
    apt-get install -y usbutils
fi

lsusb | grep -iE 'wireless|802\.11|wifi|wlan|realtek|ralink|mediatek|atheros' || echo "No recognized wireless USB string in lsusb summary."

echo -e "\n${BLUE}2. Unblocking rfkill soft/hard blocks...${NC}"
rfkill unblock wifi || true
rfkill list wifi

echo -e "\n${BLUE}3. Detecting Wireless Interfaces via iw...${NC}"
iw dev

echo -e "\n${BLUE}4. Auditing Access Point (AP) capability for each wireless device...${NC}"
for phy in $(iw dev | grep -o 'phy#[0-9]\+' | sort -u || echo ""); do
    echo "----------------------------------------------------"
    echo "Inspecting $phy:"
    if iw "$phy" info | grep -q "AP"; then
        echo -e "${GREEN}[VALID]${NC} $phy supports Access Point (AP) mode!"
    else
        echo -e "${YELLOW}[MANAGED ONLY]${NC} $phy does NOT list AP mode."
    fi
done

echo -e "\n${BLUE}5. Testing Tailscale Remote Status...${NC}"
if command -v tailscale >/dev/null 2>&1; then
    TS_IP=$(tailscale ip -4 2>/dev/null || echo "")
    if [ -n "$TS_IP" ]; then
        echo -e "${GREEN}[ACTIVE]${NC} Tailscale IP is: $TS_IP"
        echo -e "Web dashboard accessible at: ${BLUE}http://$TS_IP:3000${NC}"
    else
        echo -e "${YELLOW}[NOTICE]${NC} Tailscale is installed but not logged in. Run: sudo tailscale up"
    fi
else
    echo "Tailscale is not installed. To access remotely via IP: curl -fsSL https://tailscale.com/install.sh | sh"
fi

echo -e "\n${GREEN}USB Wi-Fi setup & audit complete.${NC}"
