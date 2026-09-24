import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Power,
  Radio,
  Router,
  Save,
  Shield,
  Sliders,
} from 'lucide-react';
import { ApConfig, WifiInterface } from '../types';

interface AccessPointViewProps {
  config: ApConfig;
  interfaces: WifiInterface[];
  apStatus: 'stopped' | 'starting' | 'running' | 'error';
  onSaveConfig: (config: Partial<ApConfig>) => Promise<{ success: boolean; message: string }>;
  onToggleAp: () => Promise<{ success: boolean; message: string }>;
}

export const AccessPointView: React.FC<AccessPointViewProps> = ({
  config,
  interfaces,
  apStatus,
  onSaveConfig,
  onToggleAp,
}) => {
  const [formData, setFormData] = useState<ApConfig>({ ...config });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedIface = interfaces.find((i) => i.name === formData.interface) || interfaces[1];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await onSaveConfig(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    setMessage(null);
    try {
      const res = await onToggleAp();
      setMessage({ type: res.success ? 'success' : 'error', text: res.message });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Toggle failed' });
    } finally {
      setIsToggling(false);
    }
  };

  // Channels for selected band
  const availableChannels =
    formData.band === '5GHz'
      ? [36, 40, 44, 48, 149, 153, 157, 161]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="space-y-6">
      {/* Top Service Controller Bar */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              apStatus === 'running'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">hostapd Access Point Service</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  apStatus === 'running'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {apStatus === 'running' ? 'Active / Broadcasting' : 'Stopped'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interface: <strong className="text-white font-mono">{formData.interface}</strong> · SSID:{' '}
              <strong className="text-white">{formData.ssid}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 ${
            apStatus === 'running'
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {isToggling ? 'Processing...' : apStatus === 'running' ? 'Stop Access Point' : 'Start Access Point'}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-white">Access Point Radio & Security Parameters</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Parameters are written to <code className="text-cyan-400 font-mono">/etc/wifi-dashboard/hostapd.conf</code>.
          </p>
        </div>

        {/* Section 1: Basic Wireless ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Wireless Interface</label>
            <select
              value={formData.interface}
              onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} ({iface.chipset}) {iface.isRtl8821c ? '★ [RTL8821C]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Network Name (SSID)</label>
            <input
              type="text"
              value={formData.ssid}
              onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Wi-Fi Password / Passphrase</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Security Protocol</label>
            <select
              value={formData.security}
              onChange={(e) => setFormData({ ...formData, security: e.target.value as ApConfig['security'] })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="wpa2">WPA2-Personal (AES-CCMP) - Standard</option>
              <option value="wpa3">WPA3-Personal (SAE) - Next-Gen</option>
              <option value="wpa2_wpa3">WPA2/WPA3 Mixed Transition Mode</option>
            </select>
          </div>
        </div>

        {/* Section 2: Frequency & RF Settings */}
        <div className="pt-4 border-t border-slate-800">
          <h5 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Radio Frequency & Channel Settings
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Frequency Band</label>
              <select
                value={formData.band}
                onChange={(e) => {
                  const newBand = e.target.value as '2.4GHz' | '5GHz';
                  setFormData({
                    ...formData,
                    band: newBand,
                    channel: newBand === '5GHz' ? 36 : 6,
                    channelWidth: newBand === '5GHz' ? '80MHz' : '20MHz',
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="5GHz">5 GHz (802.11ac - High Speed / RTL8821C)</option>
                <option value="2.4GHz">2.4 GHz (802.11n - Long Range)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Wireless Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {availableChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    Channel {ch} {ch === 36 ? '(Non-DFS Standard)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Channel Bandwidth</label>
              <select
                value={formData.channelWidth}
                onChange={(e) => setFormData({ ...formData, channelWidth: e.target.value as ApConfig['channelWidth'] })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="20MHz">20 MHz (Legacy/Narrow)</option>
                <option value="40MHz">40 MHz (HT40)</option>
                {formData.band === '5GHz' && <option value="80MHz">80 MHz (VHT80 - Up to 433.3 Mbps)</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Advanced RF & Regulatory */}
        <div className="pt-4 border-t border-slate-800">
          <h5 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Regulatory & Performance Tuning
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Country / Reg Domain</label>
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="US">US - United States</option>
                <option value="DE">DE - Germany / Europe</option>
                <option value="GB">GB - United Kingdom</option>
                <option value="JP">JP - Japan</option>
                <option value="CA">CA - Canada</option>
                <option value="AU">AU - Australia</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Max Clients</label>
              <input
                type="number"
                min={1}
                max={128}
                value={formData.maxClients}
                onChange={(e) => setFormData({ ...formData, maxClients: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Beacon Interval (TU)</label>
              <input
                type="number"
                min={20}
                max={1000}
                value={formData.beaconInterval}
                onChange={(e) => setFormData({ ...formData, beaconInterval: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Tx Power (dBm)</label>
              <input
                type="number"
                min={5}
                max={30}
                value={formData.txPowerDbm}
                onChange={(e) => setFormData({ ...formData, txPowerDbm: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="hiddenSsid"
              checked={formData.hiddenSsid}
              onChange={(e) => setFormData({ ...formData, hiddenSsid: e.target.checked })}
              className="accent-cyan-500 rounded"
            />
            <label htmlFor="hiddenSsid" className="text-xs text-slate-300 cursor-pointer">
              Hidden SSID (Do not broadcast network name in beacon frames)
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
            {isSaving ? 'Saving...' : 'Save & Update hostapd'}
          </button>
        </div>
      </form>
    </div>
  );
};
