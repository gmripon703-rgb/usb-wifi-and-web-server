#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Dashboard - Access Point Launcher
# Starts hostapd and dnsmasq on secondary Wi-Fi interface (e.g. RTL8821C)
# Safely configures static IP and ensures NetworkManager does not conflict.
# ==============================================================================

set -euo pipefail

CONF_DIR="/etc/wifi-dashboard"
AP_IFACE="${1:-wlan1}"
LAN_IP="${2:-192.168.50.1/24}"

echo "Starting Wi-Fi Access Point on $AP_IFACE..."

# 1. Inform NetworkManager to leave the AP interface unmanaged so hostapd has exclusive control
if command -v nmcli >/dev/null 2>&1; then
    echo "Setting $AP_IFACE as unmanaged in NetworkManager..."
    nmcli device set "$AP_IFACE" managed no 2>/dev/null || true
fi

# 2. Assign static IP address to AP interface
echo "Assigning static IP $LAN_IP to $AP_IFACE..."
ip addr flush dev "$AP_IFACE" 2>/dev/null || true
ip addr add "$LAN_IP" dev "$AP_IFACE"
ip link set "$AP_IFACE" up

# 3. Start hostapd in daemon mode
if [ -f "$CONF_DIR/hostapd.conf" ]; then
    echo "Launching hostapd..."
    hostapd -B "$CONF_DIR/hostapd.conf"
else
    echo "ERROR: Missing $CONF_DIR/hostapd.conf" >&2
    exit 1
fi

# 4. Start dnsmasq
if [ -f "$CONF_DIR/dnsmasq.conf" ]; then
    echo "Launching dnsmasq..."
    dnsmasq --conf-file="$CONF_DIR/dnsmasq.conf"
else
    echo "ERROR: Missing $CONF_DIR/dnsmasq.conf" >&2
    exit 1
fi

echo "Access Point and DHCP/DNS services started successfully on $AP_IFACE."
