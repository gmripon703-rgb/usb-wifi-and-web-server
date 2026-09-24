import React, { useState, useEffect } from 'react';
import {
  ArrowDownUp,
  BarChart2,
  Lock,
  Radio,
  RefreshCw,
  Repeat,
  Search,
  Signal,
  Wifi,
} from 'lucide-react';
import { ScanResult, ViewTab, WifiInterface } from '../types';

interface ScannerViewProps {
  interfaces: WifiInterface[];
  onScan: (iface: string) => Promise<ScanResult[]>;
  onNavigate: (tab: ViewTab) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ interfaces, onScan, onNavigate }) => {
  const defaultIface = interfaces.find((i) => i.isWan)?.name || interfaces[0]?.name || 'wlan0';
  const [selectedIface, setSelectedIface] = useState<string>(defaultIface);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'signal' | 'channel' | 'ssid' | 'frequency'>('signal');
  const [filterBand, setFilterBand] = useState<'all' | '2.4GHz' | '5GHz'>('all');

  const executeScan = async () => {
    setIsScanning(true);
    try {
      const data = await onScan(selectedIface);
      setResults(data);
    } catch {
      // scan error handled
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    executeScan();
  }, [selectedIface]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      executeScan();
    }, 12000);
    return () => clearInterval(timer);
  }, [autoRefresh, selectedIface]);

  // Filtering and sorting
  const filtered = results
    .filter((r) => {
      const matchesSearch =
        r.ssid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bssid.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBand = filterBand === 'all' || r.band === filterBand;
      return matchesSearch && matchesBand;
    })
    .sort((a, b) => {
      if (sortBy === 'signal') return b.signalDbm - a.signalDbm;
      if (sortBy === 'channel') return a.channel - b.channel;
      if (sortBy === 'ssid') return a.ssid.localeCompare(b.ssid);
      if (sortBy === 'frequency') return a.frequencyMhz - b.frequencyMhz;
      return 0;
    });

  // Calculate channel distribution
  const channelCounts: Record<number, number> = {};
  results.forEach((r) => {
    channelCounts[r.channel] = (channelCounts[r.channel] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Wireless Spectrum & Surrounding AP Scanner</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live scanning via <code className="text-cyan-400 font-mono">iw dev {selectedIface} scan</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Interface selector */}
            <select
              value={selectedIface}
              onChange={(e) => setSelectedIface(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  Scan on {iface.name}
                </option>
              ))}
            </select>

            {/* Auto refresh toggle */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              Auto-scan (12s)
            </label>

            <button
              onClick={executeScan}
              disabled={isScanning}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              Scan Now
            </button>
          </div>
        </div>

        {/* Filter & Sort Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by SSID or BSSID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Band selector */}
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setFilterBand('all')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterBand === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Bands
              </button>
              <button
                onClick={() => setFilterBand('2.4GHz')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterBand === '2.4GHz' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2.4 GHz
              </button>
              <button
                onClick={() => setFilterBand('5GHz')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterBand === '5GHz' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                5 GHz
              </button>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowDownUp className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="signal">Sort by Signal Strength</option>
                <option value="channel">Sort by Channel</option>
                <option value="ssid">Sort by SSID</option>
                <option value="frequency">Sort by Frequency</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Occupancy Heatmap Visualizer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Detected Channel Distribution & Congestion
          </span>
          <span className="text-slate-400 font-mono text-[11px]">{results.length} total networks</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-14 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 36, 40, 44, 48, 149, 153, 157, 161].map((ch) => {
            const count = channelCounts[ch] || 0;
            return (
              <div
                key={ch}
                className={`p-2 rounded border text-center transition-all ${
                  count > 0
                    ? count > 2
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-600'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400">Ch {ch}</div>
                <div className="text-xs font-bold font-mono">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">SSID / Network Name</th>
                <th className="py-3 px-4">BSSID (MAC)</th>
                <th className="py-3 px-4">Signal</th>
                <th className="py-3 px-4">Band / Channel</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Security</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((net) => (
                <tr key={net.bssid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Wifi className={`w-4 h-4 shrink-0 ${net.qualityPercent > 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span className="font-semibold text-white truncate max-w-xs">{net.ssid}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{net.bssid}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className={net.signalDbm > -65 ? 'text-emerald-400' : 'text-amber-400'}>
                        {net.signalDbm} dBm
                      </span>
                      <span className="text-[10px] text-slate-500">({net.qualityPercent}%)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                      {net.band} · Ch {net.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{net.frequencyMhz} MHz</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{net.security}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate('repeater')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 font-medium transition-colors text-[11px] inline-flex items-center gap-1"
                    >
                      <Repeat className="w-3 h-3" />
                      Repeat
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    {isScanning ? 'Scanning for nearby networks...' : 'No Wi-Fi networks found matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
