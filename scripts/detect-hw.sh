#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Repeater / AP Dashboard - Hardware & Capabilities Detector
# Target: Ubuntu Desktop 22.04 / 24.04 AMD64
# Safely inspects wireless interfaces, driver modules, PHY capabilities & RTL8821C
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Wi-Fi Interface & RTL8821C Detection Engine"
echo " Host: $(uname -s) $(uname -m) - Kernel $(uname -r)"
echo "=========================================================="

# 1. Identify default Internet / WAN route
DEFAULT_ROUTE_IFACE=$(ip route show default 2>/dev/null | awk '/default/ {print $5}' | head -n1 || echo "")
echo "Active WAN/Internet Gateway Interface: [${DEFAULT_ROUTE_IFACE:-None}]"

# 2. Inspect all wireless interfaces via iw
if ! command -v iw >/dev/null 2>&1; then
    echo "ERROR: 'iw' tool is not installed. Install with: sudo apt install -y iw"
    exit 1
fi

echo ""
echo "=== Detected Wireless Interfaces ==="
for iface_path in /sys/class/net/*; do
    iface=$(basename "$iface_path")
    if [ -d "$iface_path/wireless" ] || [ -d "$iface_path/phy80211" ]; then
        MAC=$(cat "$iface_path/address" 2>/dev/null || echo "Unknown")
        OPERSTATE=$(cat "$iface_path/operstate" 2>/dev/null || echo "down")
        
        # Driver resolution from sysfs
        DRIVER="unknown"
        if [ -L "$iface_path/device/driver" ]; then
            DRIVER=$(basename "$(readlink "$iface_path/device/driver")")
        fi
        
        # PHY determination
        PHY="unknown"
        if [ -L "$iface_path/phy80211" ]; then
            PHY=$(basename "$(readlink "$iface_path/phy80211")")
        fi

        IS_WAN="No"
        if [ "$iface" = "$DEFAULT_ROUTE_IFACE" ]; then
            IS_WAN="YES (PROTECTED - WAN UPLINK)"
        fi

        echo "----------------------------------------------------"
        echo " Interface:       $iface"
        echo " MAC Address:     $MAC"
        echo " State:           $OPERSTATE"
        echo " Kernel Driver:   $DRIVER"
        echo " PHY:             $PHY"
        echo " WAN Role:        $IS_WAN"

        # Check for RTL8821C specifically
        if [[ "$DRIVER" =~ (8821|rtw88_8821) ]]; then
            echo " [MATCH] RTL8821C detected! Model: 802.11ac 1x1 Wi-Fi Adapter"
            echo " Concurrency:     Simultaneous STA+AP is NOT supported on rtw88 driver."
            echo " Recommended Mode: Mode A (NAT Access Point using separate built-in WAN)"
        fi
    fi
done

# 3. Inspect Connected USB Wi-Fi Dongles
echo ""
echo "=== Detected USB Wireless Adapters (lsusb) ==="
if command -v lsusb >/dev/null 2>&1; then
    lsusb | grep -iE 'wireless|802\.11|wifi|wlan|realtek|ralink|mediatek|atheros' || echo "No explicit USB Wi-Fi match in lsusb (or using built-in PCIe card)."
else
    echo "Notice: 'lsusb' is not installed. Install via: sudo apt install -y usbutils"
fi

# 4. Tailscale Remote Status
echo ""
echo "=== Tailscale Remote Status ==="
if command -v tailscale >/dev/null 2>&1; then
    TS_STATUS=$(tailscale status 2>/dev/null || echo "Tailscale installed but stopped")
    TS_IP=$(tailscale ip -4 2>/dev/null || echo "None")
    echo "Tailscale Node IPv4: [${TS_IP}]"
else
    echo "Tailscale is not installed. (Optional for remote hosting: curl -fsSL https://tailscale.com/install.sh | sh)"
fi

echo ""
echo "Detection completed successfully."
