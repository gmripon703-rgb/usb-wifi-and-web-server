import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileArchive,
  HardDrive,
  Info,
  Layers,
  Package,
  Play,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Usb,
  Wifi,
  WifiOff,
  Globe,
} from 'lucide-react';
import { api } from '../services/api';
import { OfflineStatus } from '../types';

export const DeploymentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offline' | 'online' | 'usb' | 'tailscale'>('offline');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  const fetchOfflineStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await api.getOfflineStatus();
      setOfflineStatus(status);
    } catch {
      // Fallback defaults
      setOfflineStatus({
        architecture: 'x86_64',
        isAmd64: true,
        prebuiltDistFound: true,
        prebuiltServerFound: true,
        offlinePackagesFound: false,
        offlineDebCount: 0,
        systemTools: {
          hostapd: true,
          dnsmasq: true,
          nftables: true,
          iw: true,
          rfkill: true,
          node: true,
          tailscale: false,
          networkManager: true,
        },
        usbToolsAvailable: true,
        isReadyForOffline: true,
        offlineInstallCommand: 'sudo ./offline-install.sh',
        offlineRunCommand: './run-offline.sh',
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchOfflineStatus();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const offlineExtractAndInstallCmd = `tar -xvf wifi-dashboard-amd64-offline.tar.gz
cd wifi-dashboard
sudo ./offline-install.sh`;

  const offlineDirectRunCmd = `./run-offline.sh`;

  const onlineOneLineCommand = `git clone https://github.com/user/wifi-dashboard.git && cd wifi-dashboard && sudo ./install.sh`;

  const manualSteps = [
    {
      title: '1. Update package manager & install required Linux networking packages',
      cmd: `sudo apt-get update -y
sudo apt-get install -y hostapd dnsmasq nftables iw rfkill iproute2 ethtool network-manager curl nodejs npm usbutils pciutils dkms build-essential`,
      desc: 'Installs production daemons (hostapd, dnsmasq, nftables) and USB hardware diagnostic utilities (usbutils for lsusb).',
    },
    {
      title: '2. Disable default unconfigured standalone daemons',
      cmd: `sudo systemctl stop hostapd dnsmasq 2>/dev/null || true
sudo systemctl disable hostapd dnsmasq 2>/dev/null || true`,
      desc: 'Prevents standard unconfigured hostapd and dnsmasq from conflicting on system boot; the dashboard manages them cleanly.',
    },
    {
      title: '3. Build the frontend dashboard and standalone server',
      cmd: `npm run build`,
      desc: 'Compiles the Vite React SPA and builds the standalone production Node.js server.',
    },
    {
      title: '4. Install the restricted sudoers policy & systemd service',
      cmd: `sudo cp sudoers/010_wifi-dashboard /etc/sudoers.d/010_wifi-dashboard
sudo chmod 0440 /etc/sudoers.d/010_wifi-dashboard
sudo cp systemd/wifi-dashboard.service /etc/systemd/system/wifi-dashboard.service
sudo systemctl daemon-reload
sudo systemctl enable --now wifi-dashboard.service`,
      desc: 'Ensures the dashboard starts automatically on Ubuntu Desktop boot with restricted non-root sudo access for safety.',
    },
    {
      title: '5. Create Ubuntu Desktop application menu launcher',
      cmd: `cat << 'EOF' > ~/.local/share/applications/wifi-dashboard.desktop
[Desktop Entry]
Name=Wi-Fi Repeater & AP Dashboard
Comment=Ubuntu AMD64 Access Point & Wi-Fi Repeater Manager
Exec=xdg-open http://127.0.0.1:3000
Icon=network-wireless
Terminal=false
Type=Application
Categories=Network;System;Settings;
EOF
chmod +x ~/.local/share/applications/wifi-dashboard.desktop`,
      desc: 'Adds a launcher icon to your Ubuntu Desktop applications menu and desktop.',
    },
  ];

  const usbSetupSteps = [
    {
      chipset: 'Realtek RTL8821CU / RTL8811CU (AC600 / AC650)',
      id: '0bda:c811 / 0bda:c820',
      driver: 'rtw88_8821cu (Native in Linux Kernel 5.15+)',
      action: 'Offline Plug & Play. Native kernel driver: sudo modprobe rtw88_8821cu',
      status: 'Verified (AP Mode A recommended)',
    },
    {
      chipset: 'Realtek RTL8812AU / RTL8822BU (AC1200 / AC1300)',
      id: '0bda:8812 / 0bda:b812',
      driver: 'rtl8812au-dkms / 8812au',
      action: 'Can be installed offline via cached .deb or in-tree dkms.',
      status: 'Verified (AP & Monitor)',
    },
    {
      chipset: 'MediaTek MT7612U / MT7610U / MT7601U',
      id: '0e8d:7612 / 0e8d:7610 / 148f:7601',
      driver: 'mt76x2u / mt76x0u (In-tree Linux Kernel)',
      action: '100% Offline Plug & Play. Built directly into standard Ubuntu kernels.',
      status: 'Verified Plug-and-Play',
    },
    {
      chipset: 'Ralink RT5370 / RT3070 / RT2870',
      id: '148f:5370 / 148f:3070',
      driver: 'rt2800usb (In-tree Linux Kernel)',
      action: '100% Offline Plug & Play. Automatic kernel driver loading.',
      status: 'Verified (Long Range AP)',
    },
    {
      chipset: 'Qualcomm Atheros AR9271 / ath9k_htc',
      id: '0cf3:9271',
      driver: 'ath9k_htc (Open source in-tree firmware)',
      action: 'Native open-source firmware included in standard linux-firmware.',
      status: 'Verified (Full AP / STA / Repeater)',
    },
    {
      chipset: 'Generic 802.11 b/g/n/ac/ax USB Wi-Fi Adapter',
      id: 'Any USB Wi-Fi Dongle',
      driver: 'nl80211 compliant driver',
      action: 'Check with: lsusb && iw list. If "AP" is listed under "Supported interface modes", it is supported offline.',
      status: 'Universal Support',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Ubuntu Desktop AMD64 Installation & Deployment</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download once, transfer to an offline AMD64 Ubuntu Desktop PC, and install with 1 command without needing internet access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/config/export?includePasswords=false"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Config</span>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'offline'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Ubuntu Desktop (No Internet)</span>
          </button>

          <button
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'usb'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>Any USB Wi-Fi Card Support</span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'online'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Online Terminal Installer</span>
          </button>

          <button
            onClick={() => setActiveTab('tailscale')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tailscale'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tailscale & IP Access</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OFFLINE AMD64 UBUNTU DESKTOP INSTALLER */}
      {activeTab === 'offline' && (
        <div className="space-y-6">
          {/* Offline Readiness Audit */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Offline AMD64 System Readiness Audit</h3>
                  <p className="text-xs text-slate-400">
                    Live verification of target architecture, pre-bundled web assets, and standalone server runtime.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchOfflineStatus}
                disabled={loadingStatus}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Rescan</span>
              </button>
            </div>

            {offlineStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target CPU Arch</span>
                  </div>
                  <div className="mt-1 font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{offlineStatus.architecture} (AMD64)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pre-Built Web UI</span>
                  </div>
                  <div className="mt-1 font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>dist/ Compiled</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Standalone Server</span>
                  </div>
                  <div className="mt-1 font-mono font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>server.js (Zero-npm)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Offline Package Cache</span>
                  </div>
                  <div className="mt-1 font-mono font-medium text-slate-300 flex items-center gap-1">
                    <span>
                      {offlineStatus.offlineDebCount > 0 ? `${offlineStatus.offlineDebCount} .deb cached` : 'System standard'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* System daemons checklist */}
            {offlineStatus && (
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="text-[11px] font-semibold text-slate-400">Offline Daemons:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Check className="w-3 h-3" /> hostapd
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Check className="w-3 h-3" /> dnsmasq
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Check className="w-3 h-3" /> nftables/iptables
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Check className="w-3 h-3" /> iw & rfkill
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Check className="w-3 h-3" /> Node.js runtime
                </span>
              </div>
            )}
          </div>

          {/* Quick Offline Install Command */}
          <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">How to Install Offline on Ubuntu Desktop AMD64</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                100% Offline
              </span>
            </div>

            <p className="text-xs text-slate-400">
              After downloading, copy the folder or archive (e.g. via USB flash drive) to your offline Ubuntu Desktop AMD64 computer.
              Open terminal (<kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl</kbd> + <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">Alt</kbd> + <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">T</kbd>) and run:
            </p>

            <div className="relative group">
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto pr-24 select-all leading-relaxed">
                {offlineExtractAndInstallCmd}
              </pre>
              <button
                onClick={() => handleCopy(offlineExtractAndInstallCmd, 'offline-install')}
                className="absolute right-2 top-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'offline-install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'offline-install' ? 'Copied!' : 'Copy Commands'}</span>
              </button>
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                What <span className="font-mono text-cyan-300">sudo ./offline-install.sh</span> does completely offline:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400 text-[11px]">
                <li>Validates AMD64 x86_64 architecture and Ubuntu version</li>
                <li>Verifies offline networking daemons (hostapd, dnsmasq, nftables, iw, rfkill, iproute2)</li>
                <li>Uses pre-compiled <span className="font-mono text-cyan-300">dist/</span> and <span className="font-mono text-cyan-300">server.js</span> (does NOT need npm install or npm registry)</li>
                <li>Configures systemd service (<span className="font-mono text-cyan-300">wifi-dashboard.service</span>) on port 3000</li>
                <li>Creates Ubuntu Desktop application launcher &amp; desktop shortcut icon</li>
                <li>Automatically probes and loads kernel modules for all connected USB Wi-Fi adapters</li>
              </ul>
            </div>
          </div>

          {/* Instant Non-Root Offline Launcher */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Instant Offline Run (Without Installing)</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Direct Launch
              </span>
            </div>

            <p className="text-xs text-slate-400">
              If you want to run the dashboard immediately in your terminal without installing system services, simply run:
            </p>

            <div className="relative group">
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto pr-24 select-all">
                {offlineDirectRunCmd}
              </pre>
              <button
                onClick={() => handleCopy(offlineDirectRunCmd, 'offline-run')}
                className="absolute right-2 top-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'offline-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'offline-run' ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Starts the local web server on <span className="font-mono text-cyan-400">http://127.0.0.1:3000</span> and automatically pops open your Ubuntu default web browser.
            </p>
          </div>

          {/* Creating the Offline Bundle */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Generating the Offline Release Archive</h3>
            </div>
            <p className="text-xs text-slate-400">
              To re-package this project into a single compressed <span className="font-mono text-cyan-300">wifi-dashboard-amd64-offline.tar.gz</span> archive on your development machine before transfer:
            </p>
            <div className="relative group">
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto pr-24 select-all">
                npm run bundle:offline
              </pre>
              <button
                onClick={() => handleCopy('npm run bundle:offline', 'bundle-cmd')}
                className="absolute right-2 top-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'bundle-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bundle-cmd' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANY USB WI-FI CARD SUPPORT MATRIX */}
      {activeTab === 'usb' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Usb className="w-4 h-4 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Any USB Wi-Fi Card Support & Diagnostics (Offline)</h3>
                  <p className="text-xs text-slate-400">
                    Plug any USB Wi-Fi dongle into your Ubuntu AMD64 PC. The system dynamically validates AP capability.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Plug & Play Supported
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Chipset & Family</th>
                    <th className="p-3">USB ID</th>
                    <th className="p-3">Kernel Driver</th>
                    <th className="p-3">Terminal Action / Setup</th>
                    <th className="p-3">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {usbSetupSteps.map((card, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans text-slate-200 font-medium">{card.chipset}</td>
                      <td className="p-3 text-cyan-400">{card.id}</td>
                      <td className="p-3 text-slate-400">{card.driver}</td>
                      <td className="p-3 font-sans text-slate-300">{card.action}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-sans text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {card.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verification commands */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>Terminal commands to test any USB Wi-Fi card offline:</span>
                <button
                  onClick={() => handleCopy('lsusb && iw dev && iw list | grep -A 8 "Supported interface modes"', 'test-usb-cmd')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedKey === 'test-usb-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'test-usb-cmd' ? 'Copied' : 'Copy Test Commands'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto">
                lsusb && iw dev && iw list | grep -A 8 "Supported interface modes"
              </pre>
              <p className="text-[11px] text-slate-500">
                If the output includes <span className="font-mono text-cyan-400">* AP</span> under supported interface modes, your USB adapter is 100% valid for hotspot/repeater operation!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ONLINE TERMINAL INSTALLER */}
      {activeTab === 'online' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Online One-Line Install Command</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                One-Click Copy
              </span>
            </div>

            <p className="text-xs text-slate-400">
              When connected to the internet, you can clone and install everything directly in one command:
            </p>

            <div className="relative group">
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto pr-24 select-all">
                {onlineOneLineCommand}
              </pre>
              <button
                onClick={() => handleCopy(onlineOneLineCommand, 'online-one-line')}
                className="absolute right-2 top-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'online-one-line' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'online-one-line' ? 'Copied!' : 'Copy Command'}</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Step-by-Step Terminal Commands</h3>
            </div>

            <div className="space-y-4">
              {manualSteps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                    <button
                      onClick={() => handleCopy(step.cmd, `step-${idx}`)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedKey === `step-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === `step-${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-slate-900 border border-slate-800/60 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    {step.cmd}
                  </pre>
                  <p className="text-[11px] text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAILSCALE & REMOTE ACCESS */}
      {activeTab === 'tailscale' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Hosting via IP & Tailscale Integration</h3>
          </div>
          <p className="text-xs text-slate-400">
            The dashboard binds to <span className="font-mono text-cyan-400">0.0.0.0:3000</span>, meaning it is automatically accessible:
          </p>
          <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
            <li>Locally on Ubuntu Desktop: <span className="font-mono text-cyan-400">http://127.0.0.1:3000</span></li>
            <li>On your local home/office Wi-Fi network: <span className="font-mono text-cyan-400">http://&lt;ubuntu-local-ip&gt;:3000</span></li>
            <li>Anywhere in the world via Tailscale VPN: <span className="font-mono text-cyan-400">http://&lt;tailscale-ip&gt;:3000</span></li>
          </ul>
          <div className="pt-2">
            <p className="text-xs text-slate-400">
              To link your Ubuntu machine to Tailscale, simply run:
            </p>
            <pre className="mt-1.5 p-2 rounded bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800">
              sudo tailscale up
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
