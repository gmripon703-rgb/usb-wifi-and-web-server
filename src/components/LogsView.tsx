import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { LogEntry } from '../types';
import { api } from '../services/api';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = async () => {
    try {
      await api.clearLogs();
      fetchLogs();
    } catch {
      // ignore
    }
  };

  const filtered = logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === 'all' || log.source === selectedSource;
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesSource && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">System Daemon & Application Logs</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated journald entries for hostapd, dnsmasq, NetworkManager, and nftables.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Clears in-memory dashboard audit logs (system journald is preserved)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear App Logs
            </button>
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search log messages..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Sources</option>
            <option value="app">app (Dashboard)</option>
            <option value="hostapd">hostapd (AP Daemon)</option>
            <option value="dnsmasq">dnsmasq (DHCP/DNS)</option>
            <option value="nftables">nftables (Firewall)</option>
            <option value="kernel">kernel / rtw88</option>
            <option value="NetworkManager">NetworkManager</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      {/* Log Console Window */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-[11px] text-slate-400">journald stdout · {filtered.length} entries</span>
          </div>
          <span className="text-[11px] text-slate-500">Live Timestamp UTC</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 select-text">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 hover:bg-slate-900/60 p-1 rounded transition-colors">
              <span className="text-slate-500 shrink-0 text-[11px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 uppercase font-semibold ${
                  log.level === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : log.level === 'warn'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-slate-800 text-cyan-400'
                }`}
              >
                {log.source}
              </span>
              <span
                className={`flex-1 break-words leading-relaxed ${
                  log.level === 'error'
                    ? 'text-rose-300'
                    : log.level === 'warn'
                    ? 'text-amber-200'
                    : 'text-slate-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No matching log records found for the selected query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
