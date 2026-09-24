import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  Radio,
  Repeat,
  Router,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  Wifi,
} from 'lucide-react';
import { SystemStatus, ViewTab, WifiInterface } from '../types';

interface DashboardViewProps {
  status: SystemStatus | null;
  interfaces: WifiInterface[];
  onNavigate: (tab: ViewTab) => void;
  onToggleAp: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  interfaces,
  onNavigate,
  onToggleAp,
}) => {
  // Historical bandwidth points for live SVG mini sparkline
  const [trafficHistory, setTrafficHistory] = useState<number[]>([
    2.1, 2.4, 2.2, 2.7, 3.1, 2.8, 2.5, 3.2, 3.4, 2.9, 3.0, 3.5, 3.2, 2.8, 3.1
  ]);

  useEffect(() => {
    if (!status) return;
    const currentMb = status.rxRateBytesPerSec / (1024 * 1024);
    setTrafficHistory((prev) => [...prev.slice(1), parseFloat(currentMb.toFixed(2))]);
  }, [status?.rxRateBytesPerSec]);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  const wanIface = interfaces.find((i) => i.isWan) || interfaces[0];
  const apIface = interfaces.find((i) => i.name === status?.apInterface) || interfaces[1];

  return (
    <div className="space-y-6">
      {/* Top Alert / Notice Banner if RTL8821C constraint */}
      {status?.warningMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-semibold text-amber-300">Hardware Notice: </span>
            {status.warningMessage}
          </div>
        </div>
      )}

      {/* Primary Status Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WAN Status Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">WAN Internet Uplink</span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-semibold text-white font-mono">{status?.wanInterface || 'wlan0'}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              IP: {status?.wanIp || '192.168.1.145'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span>GW: {status?.defaultGateway || '192.168.1.1'}</span>
              <span>DNS: {status?.dnsServers?.[0] || '1.1.1.1'}</span>
            </div>
          </div>
        </div>

        {/* AP Status Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Hotspot AP (RTL8821C)</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border ${
                status?.apStatus === 'running'
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                  : 'text-slate-400 bg-slate-800 border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status?.apStatus === 'running' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
              {status?.apStatus === 'running' ? 'Broadcasting' : 'Inactive'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-semibold text-white truncate" title={status?.ssid}>
              {status?.ssid || 'Ubuntu-RTL-Hotspot-5G'}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Ch {status?.channel || 36} · {status?.band || '5GHz'} · {status?.security || 'WPA2'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span>Adapter: {status?.apInterface || 'wlan1'}</span>
              <button
                onClick={onToggleAp}
                className="text-cyan-400 hover:text-cyan-300 font-sans hover:underline text-xs"
              >
                {status?.apStatus === 'running' ? 'Stop AP' : 'Start AP'}
              </button>
            </div>
          </div>
        </div>

        {/* Connected Clients Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Wi-Fi Clients</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold text-white font-mono tabular-nums">
              {status?.connectedClientsCount ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              DHCP: 192.168.50.100 - .250
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span className="font-mono">Subnet: 192.168.50.1/24</span>
              <button
                onClick={() => onNavigate('clients')}
                className="text-cyan-400 hover:text-cyan-300 font-sans hover:underline text-xs"
              >
                Manage →
              </button>
            </div>
          </div>
        </div>

        {/* System Uptime & Resources */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">System Resources</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-base font-semibold text-white font-mono tabular-nums flex items-center justify-between">
              <span>CPU: {status?.cpuUsagePercent ?? 0}%</span>
              <span>RAM: {status?.ramUsagePercent ?? 0}%</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Uptime: {formatUptime(status?.uptimeSeconds || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
              <span>Linux Ubuntu AMD64</span>
              <span className="text-emerald-400">Kernel 6.8+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tailscale & Terminal Installation Quick Access Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tailscale IP Quick Access */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Tailscale Remote Access</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {status?.tailscaleIp || '100.92.140.25'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Control this AP from mobile or remote PC anywhere on your Tailnet.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('tailscale')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors shrink-0"
          >
            Configure →
          </button>
        </div>

        {/* Ubuntu Desktop Terminal Installer */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Ubuntu Desktop Installer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Terminal Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct copy-paste terminal command to deploy on Ubuntu Desktop.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('deployment')}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors shrink-0"
          >
            Install Guide →
          </button>
        </div>
      </div>

      {/* Network Topology Visualizer & Live Throughput Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Topology Map */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Active Network Routing Architecture</h3>
                <p className="text-xs text-slate-400">
                  {status?.activeMode === 'mode_a_nat'
                    ? 'Mode A: Isolated NAT Masquerade (Primary Built-in Wi-Fi → Kernel NAT → RTL8821C AP)'
                    : 'Mode B: Concurrent STA + AP Repeater'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('repeater')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Repeat className="w-3.5 h-3.5" />
                Repeater Wizard
              </button>
            </div>

            {/* Architecture Flow Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              {/* Step 1: Upstream Gateway */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-white">Internet Uplink</div>
                <div className="text-[11px] font-mono text-emerald-400 mt-1">
                  {wanIface ? wanIface.name : 'wlan0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {wanIface?.chipset || 'Intel Wi-Fi 6 AX200'}
                </div>
                <div className="mt-2 text-[10px] font-mono bg-slate-900 rounded py-1 text-slate-300">
                  {wanIface?.ipAddress || '192.168.1.145'}
                </div>
              </div>

              {/* Step 2: Ubuntu Routing Kernel */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center relative">
                <div className="w-10 h-10 mx-auto rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-white">Ubuntu Desktop AMD64</div>
                <div className="text-[11px] font-mono text-cyan-400 mt-1">
                  nftables NAT Router
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ip_forward = 1 · dnsmasq
                </div>
                <div className="mt-2 text-[10px] font-mono bg-slate-900 rounded py-1 text-slate-300">
                  table wifi_dashboard_nat
                </div>
              </div>

              {/* Step 3: Secondary RTL8821C AP */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-white">Local Access Point</div>
                <div className="text-[11px] font-mono text-purple-400 mt-1">
                  {apIface ? apIface.name : 'wlan1'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {apIface?.chipset || 'Realtek RTL8821C'}
                </div>
                <div className="mt-2 text-[10px] font-mono bg-slate-900 rounded py-1 text-slate-300">
                  SSID: {status?.ssid || 'Ubuntu-RTL-Hotspot-5G'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>Total RX: <strong className="font-mono text-slate-200">{formatBytes(status?.totalRxBytes || 0)}</strong></span>
              <span>Total TX: <strong className="font-mono text-slate-200">{formatBytes(status?.totalTxBytes || 0)}</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Country: US · Regulatory Domain Active
            </div>
          </div>
        </div>

        {/* Hardware Asset Diagram & Specs Panel */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Hardware Controller</h3>
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mb-3 relative group">
              <img
                src="/src/assets/images/wifi_router_hardware_1790268295881.jpg"
                alt="Ubuntu Wi-Fi Repeater & RTL8821C Hardware"
                className="w-full h-36 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback container if image fails to render
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-cyan-400 border border-slate-800">
                RTL8821C + AX200 Dual Radios
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Secondary Chipset</span>
                <span className="text-white font-mono font-medium">Realtek RTL8821C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Kernel Driver</span>
                <span className="text-cyan-400 font-mono">rtw88_8821cu</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Bus / Form Factor</span>
                <span className="text-slate-300 font-mono">USB 2.0 / PCIe</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Wi-Fi Generation</span>
                <span className="text-slate-300">Wi-Fi 5 (802.11ac 1x1)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">AP + STA Concurrency</span>
                <span className="text-amber-400 font-mono">Unsupported (Use Mode A)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between">
            <button
              onClick={() => onNavigate('interfaces')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Inspect Interfaces →
            </button>
            <button
              onClick={() => onNavigate('diagnostics')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>

      {/* Live Bandwidth Sparkline & Activity */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Real-Time Throughput Activity</h3>
            <p className="text-xs text-slate-400">Aggregated client traffic traversing wlan1 → wlan0</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Download: {(status ? status.rxRateBytesPerSec / (1024 * 1024) : 0).toFixed(2)} MB/s
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Upload: {(status ? status.txRateBytesPerSec / (1024 * 1024) : 0).toFixed(2)} MB/s
            </span>
          </div>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="h-28 w-full bg-slate-950/60 rounded-lg border border-slate-800/80 p-3 flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradientThroughput" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <polygon
              fill="url(#gradientThroughput)"
              points={`0,30 ${trafficHistory
                .map((val, idx) => {
                  const x = (idx / (trafficHistory.length - 1)) * 100;
                  const y = 30 - Math.min(28, (val / 5) * 28);
                  return `${x},${y}`;
                })
                .join(' ')} 100,30`}
            />
            {/* Line */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trafficHistory
                .map((val, idx) => {
                  const x = (idx / (trafficHistory.length - 1)) * 100;
                  const y = 30 - Math.min(28, (val / 5) * 28);
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
