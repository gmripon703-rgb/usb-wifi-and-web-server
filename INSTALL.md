# Detailed Installation & Deployment Guide

## Supported Operating Systems
- Ubuntu 24.04 LTS (Noble Numbat) Desktop AMD64
- Ubuntu 22.04 LTS (Jammy Jellyfish) Desktop AMD64

## Hardware Requirements
1. **Primary Wi-Fi or Ethernet**: Provides connection to existing Internet router (e.g. built-in Intel Wi-Fi `wlan0` or Ethernet `eth0`).
2. **Secondary Wi-Fi Adapter**: Dedicated for the Access Point / Hotspot broadcast (e.g., Realtek RTL8821CE / RTL8821CU USB dongle `wlan1`).

## Package Dependencies
The automated installer provisions:
- `hostapd` (Wi-Fi Access Point daemon)
- `dnsmasq` (DHCP and DNS server)
- `nftables` (Modern Linux packet filtering framework)
- `iw` (nl80211 wireless configuration tool)
- `rfkill` (Kernel wireless subsystem toggle)
- `iproute2` (Routing and interface manager)
- `network-manager` (Desktop connection manager)

## Quick Start

### Option A: Offline Installation (No Internet Required)
Ideal when downloading this package and moving it to an offline/air-gapped Ubuntu AMD64 computer:
```bash
# 1. Extract the downloaded archive (if zipped/tarred)
tar -xvf wifi-dashboard-amd64-offline.tar.gz
cd wifi-dashboard

# 2. Run the offline installer
sudo ./offline-install.sh
```

Or run directly without installing system services:
```bash
./run-offline.sh
```

### Option B: Online Automated Installation
If your Ubuntu machine is connected to the internet:
```bash
sudo ./install.sh
```

## Manual Verification
```bash
# Check service status
systemctl status wifi-dashboard.service

# Check hostapd AP status
systemctl status hostapd

# Inspect isolated NAT table
nft list table inet wifi_dashboard_nat
```
