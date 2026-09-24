#!/usr/bin/env bash
# ==============================================================================
# Linux AMD64 Wi-Fi Dashboard - Safe Isolated NAT Teardown
#
# SAFETY NOTICE:
# Deletes ONLY the 'inet wifi_dashboard_nat' table.
# NEVER touches default tables, UFW tables, or custom firewalls.
# ==============================================================================

set -euo pipefail

echo "Removing isolated nftables table 'inet wifi_dashboard_nat'..."
if nft list table inet wifi_dashboard_nat >/dev/null 2>&1; then
    nft delete table inet wifi_dashboard_nat
    echo "Isolated dashboard NAT table removed successfully."
else
    echo "No dashboard NAT table found. Nothing to remove."
fi
