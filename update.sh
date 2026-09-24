#!/usr/bin/env bash
# ==============================================================================
# Updater for Linux AMD64 Wi-Fi Repeater & AP Management Dashboard
# ==============================================================================

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Error: Must be run as root or with sudo." >&2
    exit 1
fi

APP_DIR="/opt/wifi-dashboard"

if [ ! -d "$APP_DIR" ]; then
    echo "Wi-Fi Dashboard is not installed at $APP_DIR. Run ./install.sh first."
    exit 1
fi

echo "Updating Wi-Fi Dashboard at $APP_DIR..."
cd "$APP_DIR"
git pull origin main || true
npm install --production=false
npm run build

echo "Restarting service..."
systemctl restart wifi-dashboard.service
echo "Update complete."
