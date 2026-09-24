import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Cpu,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { SystemStatus, ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  status: SystemStatus | null;
  onRefresh: () => void;
  isLoading: boolean;
  onToggleMock: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  status,
  onRefresh,
  isLoading,
  onToggleMock,
}) => {
  const getTabTitle = (tab: ViewTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return { title: 'System Overview', subtitle: 'Live WAN uplink, AP interface, throughput & system health' };
      case 'interfaces':
        return { title: 'Wireless Interfaces', subtitle: 'Hardware detection, PHY capabilities, drivers & role binding' };
      case 'repeater':
        return { title: 'Repeater Wizard', subtitle: '10-step guided uplink scanning and downstream AP bridge' };
      case 'ap':
        return { title: 'Access Point Settings', subtitle: 'hostapd SSID, 802.11ac 5GHz/2.4GHz channels & encryption' };
      case 'scanner':
        return { title: 'Wi-Fi Network Scanner', subtitle: 'Real-time wireless frequency and surrounding AP survey' };
      case 'clients':
        return { title: 'Connected Clients', subtitle: 'Station leases, signal levels, PHY rates and firewall blocking' };
      case 'network':
        return { title: 'DHCP & DNS Settings', subtitle: 'dnsmasq configuration, IP subnet ranges and DNS forwarding' };
      case 'firewall':
        return { title: 'Routing & nftables NAT', subtitle: 'Kernel IPv4 forwarding and isolated NAT masquerade rules' };
      case 'diagnostics':
        return { title: 'System Diagnostics', subtitle: 'Self-test suite for hardware, drivers, services and Internet route' };
      case 'logs':
        return { title: 'Live System Logs', subtitle: 'Unified logs for hostapd, dnsmasq, NetworkManager & nftables' };
      case 'terminal':
        return { title: 'Controlled Terminal', subtitle: 'Restricted administrative Linux shell for diagnostics and auditing' };
      case 'tailscale':
        return { title: 'Tailscale Remote Link & IP', subtitle: 'Secure peer-to-peer remote access over Tailscale network IP' };
      case 'deployment':
        return { title: 'Ubuntu Desktop Terminal Installer', subtitle: 'Step-by-step terminal execution, USB Wi-Fi setup & desktop shortcut' };
      case 'settings':
        return { title: 'Settings & Backup', subtitle: 'Configuration export, import, country code and credentials' };
      default:
        return { title: 'System Overview', subtitle: 'Ubuntu AMD64 Wi-Fi Repeater & AP Management Dashboard' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  const formatRate = (bytesPerSec: number): string => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
    if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  return (
    <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-sm sticky top-0 z-30">
      {/* Title & Context */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight leading-none">{title}</h2>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>

      {/* Right Controls & Live Metrics */}
      <div className="flex items-center gap-4">
        {/* Live Throughput Badge */}
        {status && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1 text-cyan-400">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>{formatRate(status.rxRateBytesPerSec)}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{formatRate(status.txRateBytesPerSec)}</span>
            </div>
          </div>
        )}

        {/* CPU & RAM */}
        {status && (
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
            <span title="Kernel CPU Utilization">CPU {status.cpuUsagePercent}%</span>
            <span className="text-slate-700">·</span>
            <span title="System RAM Usage">RAM {status.ramUsagePercent}%</span>
          </div>
        )}

        {/* Mock / Live Hardware Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onToggleMock(false)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              !status?.isMockMode
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Execute real Linux commands (iw, ip, hostapd, nftables) on Ubuntu host"
          >
            Live Linux
          </button>
          <button
            onClick={() => onToggleMock(true)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              status?.isMockMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Safe sandbox emulation mode (no hardware changes)"
          >
            Simulation
          </button>
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          title="Refresh telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
