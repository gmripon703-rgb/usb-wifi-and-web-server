import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Link2,
  Power,
  QrCode,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';
import { TailscaleStatus } from '../types';

export const TailscaleView: React.FC = () => {
  const [status, setStatus] = useState<TailscaleStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [portInput, setPortInput] = useState<number>(3000);
  const [bindAddressInput, setBindAddressInput] = useState<string>('0.0.0.0');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getTailscaleStatus();
      setStatus(data);
      if (data.webUiPort) setPortInput(data.webUiPort);
      if (data.bindAddress) setBindAddressInput(data.bindAddress);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggle = async (up: boolean) => {
    setToggling(true);
    setMessage(null);
    try {
      const res = await api.toggleTailscale(up);
      if (res.success) {
        setStatus(res.status);
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Toggle failed' });
    } finally {
      setToggling(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateTailscaleSettings({
        webUiPort: portInput,
        bindAddress: bindAddressInput,
      });
      if (res.success) {
        setStatus(res.data);
        setMessage({ type: 'success', text: 'Tailscale bind settings saved successfully.' });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const tailscaleUrl = status?.tailscaleIp ? `http://${status.tailscaleIp}:${status.webUiPort || 3000}` : null;
  const magicDnsUrl = status?.magicDnsDomain ? `http://${status.magicDnsDomain}:${status.webUiPort || 3000}` : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Tailscale Remote Access & IP Hosting</h2>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    status?.running
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {status?.running ? 'Connected / Active' : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Securely host and control your Ubuntu Wi-Fi AP dashboard from any device anywhere on your Tailnet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleToggle(!status?.running)}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm ${
                status?.running
                  ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {toggling ? 'Updating...' : status?.running ? 'Disconnect Tailscale' : 'Connect Tailscale'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Access Endpoints Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tailscale IPv4 Direct Link */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Server className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tailscale Direct IP</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              IPv4 Tailnet
            </span>
          </div>

          <div>
            <div className="text-lg font-mono font-semibold text-white">
              {status?.tailscaleIp || '100.92.140.25'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Direct IP assigned to this Ubuntu machine by Tailscale.</p>
          </div>

          {tailscaleUrl && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-400 truncate">{tailscaleUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(tailscaleUrl, 'ip-url')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1"
                  title="Copy URL"
                >
                  {copiedKey === 'ip-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ip-url' ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={tailscaleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* MagicDNS FQDN Link */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <Link2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MagicDNS Domain</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Zero-Config Hostname
            </span>
          </div>

          <div>
            <div className="text-base font-mono font-semibold text-white truncate">
              {status?.magicDnsDomain || 'ubuntu-wifi-dashboard.tailnet.ts.net'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Human-friendly domain resolved on all devices in your Tailscale account.</p>
          </div>

          {magicDnsUrl && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-400 truncate">{magicDnsUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(magicDnsUrl, 'dns-url')}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1"
                  title="Copy URL"
                >
                  {copiedKey === 'dns-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'dns-url' ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={magicDnsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smartphone Access & QR Code Section */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Access Dashboard from Your Smartphone</h3>
              <p className="text-xs text-slate-400">
                Install Tailscale on iOS or Android, log into the same account, and instantly control this repeater.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQr ? 'Hide URL Details' : 'Show Mobile Link'}</span>
          </button>
        </div>

        {showQr && tailscaleUrl && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center shadow-md">
              {/* Visual simulated QR pattern */}
              <div className="w-full h-full border-2 border-slate-900 grid grid-cols-6 grid-rows-6 gap-0.5 p-1 bg-white">
                <div className="bg-black col-span-2 row-span-2" />
                <div className="bg-black col-start-5 col-span-2 row-span-2" />
                <div className="bg-black col-start-1 col-span-2 row-start-5 row-span-2" />
                <div className="bg-black col-start-3 row-start-3" />
                <div className="bg-black col-start-4 row-start-3" />
                <div className="bg-black col-start-3 row-start-4" />
                <div className="bg-black col-start-4 row-start-5" />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-200">How to access on mobile:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Install the free Tailscale app from the App Store or Google Play.</li>
                <li>Sign in with your Tailscale identity.</li>
                <li>
                  Open your mobile browser to:{' '}
                  <span className="font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {tailscaleUrl}
                  </span>
                </li>
                <li>Add to Phone Home Screen for full-screen PWA dashboard experience.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Server Binding & Port Settings */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Dashboard Network Binding & Web Host Settings</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Web Server Port</label>
            <input
              type="number"
              value={portInput}
              onChange={(e) => setPortInput(parseInt(e.target.value, 10) || 3000)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default 3000 (accessible on LAN and Tailscale).</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bind IP Address</label>
            <input
              type="text"
              value={bindAddressInput}
              onChange={(e) => setBindAddressInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="0.0.0.0"
            />
            <p className="text-[11px] text-slate-500 mt-1">0.0.0.0 allows both local Wi-Fi and Tailnet connections.</p>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs py-2 px-4 rounded-lg transition-colors"
            >
              Save Bind Settings
            </button>
          </div>
        </form>
      </div>

      {/* Linux Terminal Setup Guide for Tailscale on Ubuntu */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Ubuntu Desktop Terminal Commands for Tailscale</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>1. Install Tailscale on Ubuntu:</span>
              <button
                onClick={() => handleCopy('curl -fsSL https://tailscale.com/install.sh | sh', 'inst-cmd')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedKey === 'inst-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'inst-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              curl -fsSL https://tailscale.com/install.sh | sh
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>2. Start Tailscale & Authenticate:</span>
              <button
                onClick={() => handleCopy('sudo tailscale up', 'up-cmd')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedKey === 'up-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'up-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              sudo tailscale up
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>3. Check Tailscale IP address:</span>
              <button
                onClick={() => handleCopy('tailscale ip -4', 'ip-cmd')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedKey === 'ip-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'ip-cmd' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              tailscale ip -4
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
