# System & Networking Architecture

## 1. Network Topology

```
                  ┌───────────────────────────────┐
                  │    Upstream Wi-Fi Router      │
                  │   SSID: "Campus-Fiber-5G"     │
                  │   Subnet: 192.168.1.0/24      │
                  └───────────────┬───────────────┘
                                  │ 802.11ac / ax
                                  ▼
                  ┌───────────────────────────────┐
                  │   Primary Built-in Wi-Fi      │
                  │   Interface: wlan0            │
                  │   IP: 192.168.1.145           │
                  │   Default Gateway: 192.168.1.1│
                  └───────────────┬───────────────┘
                                  │
                                  │ (Kernel Routing & NAT Masquerade)
                                  ▼
                  ┌───────────────────────────────┐
                  │      Ubuntu Desktop AMD64     │
                  │  - sysctl: ip_forward = 1     │
                  │  - nftables: wifi_dashboard_nat│
                  │  - dnsmasq: 192.168.50.1/24   │
                  │  - hostapd Access Point       │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    Secondary USB/PCIe NIC     │
                  │   Interface: wlan1 (RTL8821C) │
                  │   IP: 192.168.50.1            │
                  │   SSID: Ubuntu-RTL-Hotspot-5G │
                  │   Channel: 36 (5180 MHz)      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │        Local Clients          │
                  │ 192.168.50.100 - .250         │
                  └───────────────────────────────┘
```

## 2. RTL8821C Driver Considerations

The Realtek RTL8821C chipset is an 802.11a/b/g/n/ac 1x1 single-band/dual-band capable controller found in USB adapters (`0bda:c820`, `0bda:c811`, `0bda:b822`) and PCIe cards (`10ec:c821`, `10ec:c822`).

- **Driver in Kernel**: `rtw88_8821cu` / `rtw88_8821ce`
- **AP Mode Support**: Yes, fully supported in both 2.4 GHz and 5 GHz (up to 80 MHz channel width / 433.3 Mbps link rate).
- **Concurrent STA + AP Support**: The standard `rtw88` driver stack does not support simultaneous Virtual Interface STA+AP operation on the same physical radio.
- **Architectural Solution**: The dashboard detects this constraint automatically. Instead of failing or attempting a broken STA+AP setup, it configures **Mode A (NAT Access Point)**, routing traffic between the built-in WAN card and the RTL8821C AP card.
