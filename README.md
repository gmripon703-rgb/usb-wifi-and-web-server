# Linux AMD64 Wi-Fi Repeater & Access Point Management Dashboard

A production-grade, local web-based network management dashboard for **Ubuntu Desktop (AMD64 / x86_64)**. Enables turning your Ubuntu computer into an enterprise-grade Wi-Fi hotspot or repeater using a secondary adapter (such as an RTL8821C USB/PCIe NIC) while strictly protecting your primary Internet uplink from accidental disconnection.

---

## Architecture Overview

```
                      [ Internet / Uplink Wi-Fi ]
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │   Ubuntu Built-in Wi-Fi       │  (e.g., wlan0 - Intel AX200)
                   │   Active WAN Gateway          │  [PROTECTED - NEVER DISCONNECTED]
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    Ubuntu Desktop Kernel      │
                   │  - net.ipv4.ip_forward = 1    │
                   │  - Isolated nftables table:   │
                   │    inet wifi_dashboard_nat    │
                   │  - dnsmasq (192.168.50.1/24)  │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    Secondary Wi-Fi Adapter    │  (e.g., wlan1 - RTL8821C USB)
                   │    hostapd Access Point       │  Dual-Band 2.4 / 5 GHz
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │        Wi-Fi Clients          │
                   │    Phones, Laptops, Tablets   │
                   └───────────────────────────────┘
```

---

## Key Features

1. **Safety First (WAN Protection)**:
   - Automatically detects active default gateway and WAN route.
   - Prevents binding the WAN adapter to the AP daemon.
   - Always requires user confirmation and shows exact service changes before modifying networking.

2. **Universal USB Wi-Fi Card Support & Hotplug**:
   - Works with **ANY USB Wi-Fi adapter** (Realtek RTL8821CU, RTL8812AU, RTL8814AU, MediaTek MT7612U, MT7601U, Qualcomm Atheros AR9271, Ralink RT5370, etc.).
   - Dynamically scans the USB bus (`lsusb`), detects driver status (`rtw88_8821cu`, `mt76x2u`, `ath9k_htc`), and checks AP mode capability via `iw phy`.
   - Clear diagnostic feedback if a USB card requires DKMS or firmware installation.

3. **Tailscale Remote Access & IP Hosting**:
   - Built-in Tailscale status detection, direct IP link (`http://100.x.y.z:3000`), and MagicDNS domain integration.
   - Access the dashboard securely from your smartphone, tablet, or remote laptop without opening firewall ports.
   - Configurable host bind address (`0.0.0.0`) and port settings.

4. **Isolated nftables Firewall**:
   - All NAT masquerading and forward chains live inside an isolated `table inet wifi_dashboard_nat`.
   - Never flushes or interferes with system UFW, firewalld, or Docker iptables rules.
   - Clean teardown with zero residual rules.

5. **Ubuntu Desktop Integration**:
   - Automated installer creates an application launcher (`wifi-dashboard.desktop`) in your Ubuntu desktop app menu and on the desktop.

6. **Interactive 10-Step Repeater Wizard**:
   - Guided configuration from WAN uplink selection to downstream SSID/encryption and pre-flight summary.

7. **Integrated Diagnostics Suite**:
   - Tests hardware, kernel drivers, rfkill states, NetworkManager, hostapd, dnsmasq, and Internet reachability with actionable PASS / WARNING / FAIL indicators.

8. **Restricted Web Terminal**:
   - Built-in administrative console allowing strictly allowlisted diagnostics (`ip`, `iw`, `nmcli`, `rfkill`, `nft`, `systemctl`, `ping`, `resolvectl`).
   - Hardened with least-privilege sudo policy.

9. **Real-Time Client & Bandwidth Telemetry**:
   - Track active stations, signal strengths (dBm), PHY rates (Mbps), and live throughput charts.
   - Administrative one-click client blocking and deauthentication.

---

## Installation on Ubuntu Desktop

### Option 1: Offline Installation (After Download / No Internet)
If your target Ubuntu AMD64 computer is offline or air-gapped:
```bash
# Extract the downloaded bundle
tar -xvf wifi-dashboard-amd64-offline.tar.gz
cd wifi-dashboard

# Run the 100% offline installer
sudo ./offline-install.sh
```

Or run directly without installing system services:
```bash
./run-offline.sh
```

### Option 2: Online Automated Installation
If your Ubuntu machine is connected to the internet:
```bash
git clone https://github.com/your-org/wifi-dashboard.git
cd wifi-dashboard
sudo ./install.sh
```

Once installed, open your browser:
```
http://127.0.0.1:3000
```
Or access remotely via your machine's Tailscale IP:
```
http://<your-tailscale-ip>:3000
```

To view service logs:
```bash
journalctl -u wifi-dashboard.service -f
```

To cleanly uninstall:
```bash
sudo ./uninstall.sh
```

---

## Simulation / Mock Mode

You can run and test the dashboard on any development machine without altering real network interfaces:

```bash
npm run dev
```

The system automatically detects container or non-root environments and enables the interactive hardware emulator.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
