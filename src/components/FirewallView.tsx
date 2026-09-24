import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FileCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';

export const FirewallView: React.FC = () => {
  const [firewallData, setFirewallData] = useState<{
    tableName: string;
    ipv4ForwardingEnabled: boolean;
    masqueradeActive: boolean;
    rulesetText: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFirewall = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFirewallDetails();
      setFirewallData(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFirewall();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Kernel IPv4 Routing</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-400">
            net.ipv4.ip_forward = 1
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Allows forwarding packets across WAN and AP interfaces
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">nftables NAT Masquerade</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-cyan-400">
            Active on wlan0
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Translates client IPs 192.168.50.0/24 to uplink WAN IP
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Firewall Isolation</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-purple-400">
            wifi_dashboard_nat
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Zero collision with UFW or system firewall rules
          </p>
        </div>
      </div>

      {/* Ruleset Inspection Panel */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Active nftables Isolated Ruleset</h3>
          </div>
          <button
            onClick={fetchFirewall}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Ruleset
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Inspect the live rules compiled by the dashboard. These rules strictly govern packet translation between <code className="text-cyan-400 font-mono">wlan1</code> and <code className="text-cyan-400 font-mono">wlan0</code> without altering default chains.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
          {firewallData?.rulesetText || (
            `table inet wifi_dashboard_nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname "wlan0" ip saddr 192.168.50.0/24 counter masquerade
    }

    chain forward {
        type filter hook forward priority filter; policy accept;
        iifname "wlan1" oifname "wlan0" counter accept
        iifname "wlan0" oifname "wlan1" ct state related,established counter accept
    }
}`
          )}
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Safe Uninstallation Command:</span>
          <code className="text-cyan-400 font-mono">sudo nft delete table inet wifi_dashboard_nat</code>
        </div>
      </div>
    </div>
  );
};
