#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Dashboard - Isolated NAT & Routing Setup
#
# SAFETY NOTICE:
# This script creates an ISOLATED nftables table: 'inet wifi_dashboard_nat'.
# It DOES NOT flush the general system firewall, UFW, or Docker iptables chains.
# It only applies masquerading from the downstream AP interface to the WAN interface.
# ==============================================================================

set -euo pipefail

WAN_IFACE="${1:-wlan0}"
LAN_IFACE="${2:-wlan1}"
LAN_SUBNET="${3:-192.168.50.0/24}"

echo "Configuring NAT Routing:"
echo "  WAN Interface (Uplink):   $WAN_IFACE"
echo "  LAN Interface (Downlink): $LAN_IFACE"
echo "  LAN Subnet:               $LAN_SUBNET"

# Safety check: Ensure WAN and LAN are different interfaces
if [ "$WAN_IFACE" = "$LAN_IFACE" ]; then
    echo "ERROR: WAN and LAN cannot be identical on standard NAT mode!" >&2
    exit 1
fi

# 1. Enable IPv4 packet forwarding in the Linux kernel
echo "Enabling kernel IPv4 forwarding (net.ipv4.ip_forward=1)..."
sysctl -w net.ipv4.ip_forward=1 >/dev/null

# 2. Configure nftables isolated table
echo "Applying isolated nftables rules in table 'inet wifi_dashboard_nat'..."
nft -f - <<EOF
table inet wifi_dashboard_nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname "$WAN_IFACE" ip saddr $LAN_SUBNET counter masquerade
    }

    chain forward {
        type filter hook forward priority filter; policy accept;
        iifname "$LAN_IFACE" oifname "$WAN_IFACE" counter accept
        iifname "$WAN_IFACE" oifname "$LAN_IFACE" ct state related,established counter accept
    }
}
EOF

echo "NAT masquerading and forwarding rules established successfully."
