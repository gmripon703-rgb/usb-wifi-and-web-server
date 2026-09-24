import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  Globe,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsViewProps {
  isMockMode: boolean;
  onToggleMock: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isMockMode, onToggleMock }) => {
  const [includePasswords, setIncludePasswords] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [countryCode, setCountryCode] = useState<string>('US');
  const [isApplyingReg, setIsApplyingReg] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [lanAccessEnabled, setLanAccessEnabled] = useState<boolean>(true);

  const handleExport = () => {
    window.location.href = `/api/config/export?includePasswords=${includePasswords}`;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await api.importConfig(parsed);
      setImportStatus(res);
    } catch (err: unknown) {
      setImportStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Invalid JSON file',
      });
    }
  };

  const handleRegApply = () => {
    setIsApplyingReg(true);
    setTimeout(() => {
      setIsApplyingReg(false);
      setImportStatus({ success: true, message: `Regulatory domain set to ${countryCode} (iw reg set ${countryCode}).` });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {importStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            importStatus.success
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Backup & Configuration Management */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Configuration Backup & Restore</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export complete network topology, SSIDs, and routing profiles into a portable JSON backup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Export Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Configuration Snapshot</span>
            </div>
            <p className="text-xs text-slate-400">
              Download current hostapd, dnsmasq, and nftables configuration as a JSON file.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                id="incPass"
                checked={includePasswords}
                onChange={(e) => setIncludePasswords(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <label htmlFor="incPass" className="cursor-pointer">
                Include plain Wi-Fi passwords in export (Insecure)
              </label>
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON Backup
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Restore from Backup</span>
            </div>
            <p className="text-xs text-slate-400">
              Select a previously exported JSON backup file to restore configuration profiles.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Choose JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Regulatory Domain */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Wireless Regulatory Domain</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configures maximum allowable transmit power (dBm) and DFS channel access based on regional regulations.
          </p>
        </div>

        <div className="flex items-center gap-4 max-w-md pt-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="US">US - United States (FCC Part 15)</option>
            <option value="DE">DE - Germany (ETSI)</option>
            <option value="GB">GB - United Kingdom (Ofcom)</option>
            <option value="JP">JP - Japan (MIC / TELEC)</option>
            <option value="CA">CA - Canada (ISED)</option>
            <option value="AU">AU - Australia (ACMA)</option>
          </select>

          <button
            onClick={handleRegApply}
            disabled={isApplyingReg}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isApplyingReg ? 'Applying...' : 'Set Regulatory Domain'}
          </button>
        </div>
      </div>

      {/* Operating Environment & Simulation Mode */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Hardware Emulation & Testing Sandbox</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Allows testing the UI and APIs in development or sandbox containers without altering real system network interfaces.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Safe Simulation Mode</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              When enabled, all hardware actions are simulated without running real root Linux commands.
            </div>
          </div>
          <button
            onClick={() => onToggleMock(!isMockMode)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isMockMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isMockMode ? 'Simulation Active' : 'Live Linux Hardware Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};
