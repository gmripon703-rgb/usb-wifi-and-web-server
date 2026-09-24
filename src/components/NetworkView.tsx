import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  HardDrive,
  Network,
  Save,
  Server,
} from 'lucide-react';
import { NetworkConfig } from '../types';

interface NetworkViewProps {
  config: NetworkConfig;
  onSaveNetwork: (config: Partial<NetworkConfig>) => Promise<{ success: boolean; message: string }>;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ config, onSaveNetwork }) => {
  const [formData, setFormData] = useState<NetworkConfig>({ ...config });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Strict IPv4 validator
  const isValidIp = (ip: string): boolean => {
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === n.toString();
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!isValidIp(formData.lanIp)) {
      setMessage({ type: 'error', text: 'Invalid LAN IP address format.' });
      return;
    }
    if (!isValidIp(formData.dhcpStart) || !isValidIp(formData.dhcpEnd)) {
      setMessage({ type: 'error', text: 'Invalid DHCP range IP address format.' });
      return;
    }
    if (!isValidIp(formData.gateway)) {
      setMessage({ type: 'error', text: 'Invalid Gateway IP address format.' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveNetwork(formData);
      setMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">dnsmasq DHCP & Local DNS Configuration</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Controls internal IP allocation pool and DNS resolution for connected client devices.
          </p>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Subnet & Gateway */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              Subnet & Interface Addressing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">LAN Router IP</label>
                <input
                  type="text"
                  value={formData.lanIp}
                  onChange={(e) => setFormData({ ...formData, lanIp: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Subnet Mask</label>
                <input
                  type="text"
                  value={formData.subnetMask}
                  onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Default Gateway</label>
                <input
                  type="text"
                  value={formData.gateway}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* DHCP Range */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              DHCP Client IP Allocation Pool
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">DHCP Start IP</label>
                <input
                  type="text"
                  value={formData.dhcpStart}
                  onChange={(e) => setFormData({ ...formData, dhcpStart: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">DHCP End IP</label>
                <input
                  type="text"
                  value={formData.dhcpEnd}
                  onChange={(e) => setFormData({ ...formData, dhcpEnd: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Lease Duration</label>
                <input
                  type="text"
                  value={formData.leaseTime}
                  onChange={(e) => setFormData({ ...formData, leaseTime: e.target.value })}
                  required
                  placeholder="e.g. 12h, 24h"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* DNS & Hostname */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Upstream DNS Servers & Local Domain
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Primary & Secondary DNS (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.dnsServers.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dnsServers: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Local Gateway Hostname</label>
                <input
                  type="text"
                  value={formData.localHostname}
                  onChange={(e) => setFormData({ ...formData, localHostname: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="dnsForwarding"
                checked={formData.dnsForwarding}
                onChange={(e) => setFormData({ ...formData, dnsForwarding: e.target.checked })}
                className="accent-cyan-500 rounded"
              />
              <label htmlFor="dnsForwarding" className="text-xs text-slate-300 cursor-pointer">
                Enable local DNS caching and forwarding via upstream servers
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Applying Settings...' : 'Apply Network Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
