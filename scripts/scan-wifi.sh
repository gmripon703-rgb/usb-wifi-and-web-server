#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Dashboard - Wi-Fi Network Scanner
# Safely scans for available upstream SSIDs using iw or nmcli
# ==============================================================================

set -euo pipefail

SCAN_IFACE="${1:-wlan0}"

if command -v iw >/dev/null 2>&1; then
    iw dev "$SCAN_IFACE" scan 2>/dev/null || nmcli -t -f SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY dev wifi list ifname "$SCAN_IFACE"
else
    nmcli -t -f SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY dev wifi list ifname "$SCAN_IFACE"
fi
