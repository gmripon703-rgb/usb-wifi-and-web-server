import React, { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Clock,
  Laptop,
  Radio,
  Search,
  ShieldAlert,
  Signal,
  Smartphone,
  UserX,
  Users,
} from 'lucide-react';
import { ClientDevice } from '../types';

interface ClientsViewProps {
  clients: ClientDevice[];
  onBlock: (mac: string) => Promise<{ success: boolean; message: string }>;
  onUnblock: (mac: string) => Promise<{ success: boolean; message: string }>;
  onDisconnect: (mac: string) => Promise<{ success: boolean; message: string }>;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onBlock,
  onUnblock,
  onDisconnect,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatConnectionTime = (isoString: string): string => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  const handleBlockToggle = async (client: ClientDevice) => {
    setActionMessage(null);
    try {
      const res = client.isBlocked ? await onUnblock(client.mac) : await onBlock(client.mac);
      setActionMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    }
  };

  const handleDisconnect = async (mac: string) => {
    setActionMessage(null);
    try {
      const res = await onDisconnect(mac);
      setActionMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Deauth failed' });
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ip.includes(searchQuery) ||
      c.mac.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Stat Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active Wi-Fi Stations</span>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {clients.filter((c) => !c.isBlocked).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Assigned by dnsmasq on wlan1</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Blocked Stations</span>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {clients.filter((c) => c.isBlocked).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Filtered via nftables drop rule</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Aggregated Traffic</span>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {formatBytes(clients.reduce((acc, c) => acc + c.rxBytes + c.txBytes, 0))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Total Downlink & Uplink bytes</p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Client Table & Search */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Station Leases & Radio Metrics</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Parsed from <code className="text-cyan-400 font-mono">iw dev wlan1 station dump</code> & <code className="text-cyan-400 font-mono">/var/lib/misc/dnsmasq.leases</code>.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hostname, IP, MAC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Client Hostname</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">MAC Address</th>
                  <th className="py-3 px-4">Signal</th>
                  <th className="py-3 px-4">PHY Link Rate</th>
                  <th className="py-3 px-4">Total Usage</th>
                  <th className="py-3 px-4">Connected</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((client) => (
                  <tr
                    key={client.mac}
                    className={`transition-colors ${
                      client.isBlocked ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {client.hostname.includes('Phone') ? (
                          <Smartphone className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Laptop className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-semibold text-white">{client.hostname}</span>
                        {client.isBlocked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            BLOCKED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{client.ip}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{client.mac}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono tabular-nums text-slate-300">{client.signalDbm} dBm</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ↓{client.rxRateMbps} / ↑{client.txRateMbps} Mbps
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {formatBytes(client.rxBytes + client.txBytes)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatConnectionTime(client.connectedSince)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDisconnect(client.mac)}
                          title="Deauthenticate client via hostapd"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleBlockToggle(client)}
                          title={client.isBlocked ? 'Unblock client' : 'Block client in nftables'}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            client.isBlocked
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {client.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No connected stations detected on this subnet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
