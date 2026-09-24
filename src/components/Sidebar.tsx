import React from 'react';
import {
  Activity,
  Cpu,
  Download,
  FileText,
  Globe,
  Network,
  Radio,
  Repeat,
  Router,
  Settings,
  Shield,
  Sliders,
  Terminal,
  Users,
  Wifi,
} from 'lucide-react';
import { SystemStatus, ViewTab } from '../types';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, status }) => {
  const navItems: Array<{ id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'interfaces', label: 'Wi-Fi Interfaces', icon: Wifi },
    { id: 'repeater', label: 'Repeater Wizard', icon: Repeat },
    { id: 'ap', label: 'Access Point', icon: Router },
    { id: 'scanner', label: 'Wi-Fi Scanner', icon: Radio },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'network', label: 'DHCP & DNS', icon: Network },
    { id: 'tailscale', label: 'Tailscale IP / Remote', icon: Globe },
    { id: 'deployment', label: 'Terminal Installer', icon: Download },
    { id: 'firewall', label: 'Routing & NAT', icon: Shield },
    { id: 'diagnostics', label: 'Diagnostics', icon: Sliders },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'terminal', label: 'Web Terminal', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Title Area */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Router className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
                Ubuntu Wi-Fi AP
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">AMD64 / RTL8821C</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {item.id === 'clients' && status && status.connectedClientsCount > 0 && (
                <span className="ml-auto font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  {status.connectedClientsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Persistent System Status Summary Widget */}
      <div className="p-3 m-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">WAN Uplink</span>
          <span className="flex items-center gap-1.5 font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {status?.wanInterface || 'wlan0'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">AP Hotspot</span>
          <span className="flex items-center gap-1.5 font-mono text-cyan-400">
            <span className={`w-1.5 h-1.5 rounded-full ${status?.apStatus === 'running' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
            {status?.apInterface || 'wlan1'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Routing Mode</span>
          <span className="font-mono text-slate-300">
            {status?.activeMode === 'mode_a_nat' ? 'NAT Mode A' : 'Repeater STA+AP'}
          </span>
        </div>

        {status?.isMockMode && (
          <div className="pt-1 text-[10px] text-amber-400/90 font-mono text-center bg-amber-500/10 rounded py-1 border border-amber-500/20">
            Simulation / Sandbox Mode
          </div>
        )}
      </div>
    </aside>
  );
};
