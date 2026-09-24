#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Dashboard - Access Point Teardown
# Gracefully terminates hostapd and dnsmasq instances.
# Restores interface state for NetworkManager if needed.
# ==============================================================================

set -euo pipefail

AP_IFACE="${1:-wlan1}"

echo "Stopping Access Point services on $AP_IFACE..."

# Terminate hostapd and dnsmasq
killall hostapd 2>/dev/null || true
killall dnsmasq 2>/dev/null || true

# Flush IP on AP interface
ip addr flush dev "$AP_IFACE" 2>/dev/null || true

# Restore NetworkManager management if desired
if command -v nmcli >/dev/null 2>&1; then
    nmcli device set "$AP_IFACE" managed yes 2>/dev/null || true
fi

echo "Access Point services stopped successfully."
