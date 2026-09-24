import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sliders,
  Wrench,
  XCircle,
} from 'lucide-react';
import { DiagnosticCheck } from '../types';
import { api } from '../services/api';

export const DiagnosticsView: React.FC = () => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDiagnostics();
      setChecks(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const categories = ['All', 'Hardware', 'Driver', 'Service', 'Network', 'Security'];

  const filtered = checks.filter(
    (c) => selectedCategory === 'All' || c.category === selectedCategory
  );

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warning').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Linux Networking Diagnostic Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated health checks for kernel drivers, services, routing, and wireless subsystem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Counter Chips */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {passCount} PASS
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {warnCount} WARN
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {failCount} FAIL
            </span>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Run Self-Test
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Diagnostic Check Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-xl border transition-all ${
              item.status === 'pass'
                ? 'bg-slate-900 border-slate-800'
                : item.status === 'warning'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-rose-500/5 border-rose-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {item.status === 'pass' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {item.status === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                {item.status === 'fail' && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{item.summary}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    item.status === 'pass'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : item.status === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Remediation Note if Warning or Fail */}
            {item.status !== 'pass' && item.remediation && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-slate-400">
                <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Suggested Remediation: <strong className="text-slate-200">{item.remediation}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
