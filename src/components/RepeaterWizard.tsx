import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Lock,
  Radio,
  RefreshCw,
  Repeat,
  Router,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { RepeaterConfig, ScanResult, WifiInterface } from '../types';

interface RepeaterWizardProps {
  interfaces: WifiInterface[];
  onScanWifi: (iface: string) => Promise<ScanResult[]>;
  onApplyRepeater: (config: RepeaterConfig) => Promise<{ success: boolean; message: string }>;
  onFinish: () => void;
}

export const RepeaterWizard: React.FC<RepeaterWizardProps> = ({
  interfaces,
  onScanWifi,
  onApplyRepeater,
  onFinish,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 10;

  // Wizard State
  const defaultWan = interfaces.find((i) => i.isWan)?.name || interfaces[0]?.name || 'wlan0';
  const defaultAp = interfaces.find((i) => i.name !== defaultWan)?.name || interfaces[1]?.name || 'wlan1';

  const [wanInterface, setWanInterface] = useState<string>(defaultWan);
  const [apInterface, setApInterface] = useState<string>(defaultAp);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedUpstreamSsid, setSelectedUpstreamSsid] = useState<string>('Campus-Fiber-5G');
  const [upstreamPassword, setUpstreamPassword] = useState<string>('');
  const [downstreamSsid, setDownstreamSsid] = useState<string>('Ubuntu-Repeater-Ext');
  const [downstreamPassword, setDownstreamPassword] = useState<string>('SecureExt2026!');
  const [selectedMode, setSelectedMode] = useState<'mode_a_nat' | 'mode_b_sta_ap'>('mode_a_nat');
  const [downstreamBand, setDownstreamBand] = useState<'2.4GHz' | '5GHz'>('5GHz');
  const [downstreamChannel, setDownstreamChannel] = useState<number>(36);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; message: string } | null>(null);

  const wanObj = interfaces.find((i) => i.name === wanInterface);
  const apObj = interfaces.find((i) => i.name === apInterface);

  // Trigger scan when entering step 3
  useEffect(() => {
    if (step === 3 && scanResults.length === 0) {
      triggerScan();
    }
  }, [step]);

  const triggerScan = async () => {
    setIsScanning(true);
    try {
      const results = await onScanWifi(wanInterface);
      setScanResults(results);
      if (results.length > 0 && !selectedUpstreamSsid) {
        setSelectedUpstreamSsid(results[0].ssid);
      }
    } catch {
      // scan error handled
    } finally {
      setIsScanning(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalApply = async () => {
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const config: RepeaterConfig = {
        wanInterface,
        apInterface,
        upstreamSsid: selectedUpstreamSsid,
        upstreamPassword,
        downstreamSsid,
        downstreamPassword,
        mode: selectedMode,
        channel: downstreamChannel,
        band: downstreamBand,
      };
      const res = await onApplyRepeater(config);
      setResultMessage(res);
      if (res.success) {
        setStep(10); // final step summary
      }
    } catch (err: unknown) {
      setResultMessage({
        success: false,
        message: err instanceof Error ? err.message : 'Repeater configuration failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Step Progression Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-white">Repeater Setup Wizard</span>
          <span className="font-mono">Step {step} of {totalSteps}</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Container */}
      <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 shadow-xl min-h-[420px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Select Internet/WAN Interface */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Step 1: Select Internet / WAN Interface</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the Wi-Fi or Ethernet adapter that connects this computer to the upstream Internet.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {interfaces.map((iface) => (
                  <label
                    key={iface.name}
                    className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                      wanInterface === iface.name
                        ? 'bg-cyan-500/10 border-cyan-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="wanSelect"
                          value={iface.name}
                          checked={wanInterface === iface.name}
                          onChange={() => setWanInterface(iface.name)}
                          className="accent-cyan-500"
                        />
                        <div>
                          <span className="text-sm font-bold font-mono text-white">{iface.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({iface.chipset})</span>
                        </div>
                      </div>
                      {iface.isWan && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          Active Default Route
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs font-mono text-slate-400 pl-7">
                      Driver: {iface.driver} · Current IP: {iface.ipAddress || 'DHCP unassigned'}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Select Wi-Fi AP Interface */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Step 2: Select Wi-Fi AP / Repeater Interface</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the adapter that will broadcast your downstream extended Wi-Fi hotspot.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {interfaces.map((iface) => {
                  const isConflict = iface.name === wanInterface && !iface.concurrentApStaSupport;
                  return (
                    <label
                      key={iface.name}
                      className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                        apInterface === iface.name
                          ? 'bg-cyan-500/10 border-cyan-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      } ${isConflict ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="apSelect"
                            value={iface.name}
                            checked={apInterface === iface.name}
                            disabled={isConflict}
                            onChange={() => setApInterface(iface.name)}
                            className="accent-cyan-500"
                          />
                          <div>
                            <span className="text-sm font-bold font-mono text-white">{iface.name}</span>
                            <span className="text-xs text-slate-400 ml-2">({iface.chipset})</span>
                          </div>
                        </div>
                        {iface.isRtl8821c && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                            Recommended (RTL8821C)
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-mono text-slate-400 pl-7">
                        {isConflict ? (
                          <span className="text-rose-400">
                            Cannot select {iface.name}: Already assigned as WAN and lacks concurrent STA+AP support.
                          </span>
                        ) : (
                          <span>Driver: {iface.driver} · Bands: {iface.bands.join(', ')}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 & 4: Scan and Select Upstream Network */}
          {(step === 3 || step === 4) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Step {step}: {step === 3 ? 'Scan for Upstream Wi-Fi Networks' : 'Select Upstream Network'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Surveying wireless environment using interface <code className="text-cyan-400 font-mono">{wanInterface}</code>.
                  </p>
                </div>
                <button
                  onClick={triggerScan}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
                  Rescan
                </button>
              </div>

              {isScanning ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Running `iw dev {wanInterface} scan`...
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {scanResults.map((net) => (
                    <div
                      key={net.bssid}
                      onClick={() => setSelectedUpstreamSsid(net.ssid)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                        selectedUpstreamSsid === net.ssid
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wifi className={`w-4 h-4 ${net.qualityPercent > 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <div>
                          <div className="text-xs font-bold">{net.ssid}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {net.bssid} · Ch {net.channel} · {net.band}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium">{net.signalDbm} dBm</div>
                        <div className="text-[10px] text-slate-400">{net.security}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Upstream Password */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Step 5: Enter Upstream Wi-Fi Password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the WPA/WPA2 security passphrase for upstream network <strong className="text-white font-mono">"{selectedUpstreamSsid}"</strong>.
                </p>
              </div>

              <div className="pt-4 max-w-md">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Upstream Password / WPA Passphrase
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={upstreamPassword}
                    onChange={(e) => setUpstreamPassword(e.target.value)}
                    placeholder="Enter Wi-Fi password (or leave blank if open)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono pr-10"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Stored securely in /etc/wifi-dashboard/wpa_supplicant.conf with chmod 0600.
                </p>
              </div>
            </div>
          )}

          {/* STEP 6 & 7: Downstream SSID and Password */}
          {(step === 6 || step === 7) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Step {step}: {step === 6 ? 'Configure Extended Downstream SSID' : 'Configure Downstream Password'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Set the name and security for the extended hotspot your devices will connect to.
                </p>
              </div>

              <div className="pt-4 max-w-md space-y-4">
                {step === 6 ? (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Extended Wi-Fi Name (SSID)</label>
                    <input
                      type="text"
                      value={downstreamSsid}
                      onChange={(e) => setDownstreamSsid(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setDownstreamSsid(`${selectedUpstreamSsid}_EXT`)}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Auto-name: {selectedUpstreamSsid}_EXT
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Extended Wi-Fi Password (WPA2/WPA3)</label>
                    <input
                      type="text"
                      value={downstreamPassword}
                      onChange={(e) => setDownstreamPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Must be at least 8 characters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 8: Choose NAT AP vs STA+AP */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Step 8: Choose Repeater Operating Mode</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The dashboard evaluates your wireless hardware capabilities to recommend the optimal architecture.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Mode A: NAT AP */}
                <div
                  onClick={() => setSelectedMode('mode_a_nat')}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedMode === 'mode_a_nat'
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Mode A: NAT Access Point</span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Recommended / Default
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Uplink flows through primary adapter (<code className="text-slate-300 font-mono">{wanInterface}</code>) and downstream AP broadcasts from RTL8821C (<code className="text-slate-300 font-mono">{apInterface}</code>) via isolated nftables NAT.
                  </p>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    ✓ Maximum throughput & 100% stability
                  </div>
                </div>

                {/* Mode B: STA+AP Concurrency */}
                <div
                  onClick={() => {
                    if (wanObj?.concurrentApStaSupport) setSelectedMode('mode_b_sta_ap');
                  }}
                  className={`p-4 rounded-xl border transition-colors ${
                    !wanObj?.concurrentApStaSupport
                      ? 'opacity-50 cursor-not-allowed bg-slate-950 border-slate-800'
                      : selectedMode === 'mode_b_sta_ap'
                      ? 'bg-cyan-500/10 border-cyan-500/50 cursor-pointer'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Mode B: Single-Card STA+AP</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Concurrency Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Runs both station connection and AP on a single physical radio using virtual interfaces.
                  </p>
                  <div className="text-[11px] text-amber-400 font-mono">
                    {!wanObj?.concurrentApStaSupport
                      ? '✕ Unsupported by RTL8821C / rtw88 driver.'
                      : '✓ Hardware supports virtual AP interface.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Pre-Flight Summary */}
          {step === 9 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Step 9: Configuration Pre-Flight Summary</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review the exact interface roles, services, and firewall changes that will take effect.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">WAN Uplink Interface:</span>
                  <span className="text-emerald-400 font-bold">{wanInterface} (Protected)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Upstream Network:</span>
                  <span className="text-white">{selectedUpstreamSsid}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">AP Hotspot Interface:</span>
                  <span className="text-cyan-400 font-bold">{apInterface} (Secondary Adapter)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Downstream Extended SSID:</span>
                  <span className="text-white">{downstreamSsid}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Routing Mode:</span>
                  <span className="text-cyan-400">{selectedMode === 'mode_a_nat' ? 'NAT Access Point' : 'STA+AP Repeater'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firewall Rules:</span>
                  <span className="text-slate-300">table inet wifi_dashboard_nat (Isolated)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Safety Guaranteed: Your current Internet connection on {wanInterface} will not be disconnected.</span>
              </div>
            </div>
          )}

          {/* STEP 10: Final Success / Confirmation */}
          {step === 10 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Repeater Activated Successfully!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                The secondary adapter (<strong className="text-cyan-400 font-mono">{apInterface}</strong>) is now broadcasting extended network <strong className="text-white">"{downstreamSsid}"</strong> with internet routing through <strong className="text-emerald-400 font-mono">{wanInterface}</strong>.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-sm mx-auto text-left text-xs font-mono space-y-1">
                <div className="text-slate-400">Extended SSID: <strong className="text-white">{downstreamSsid}</strong></div>
                <div className="text-slate-400">Password: <strong className="text-white">{downstreamPassword}</strong></div>
                <div className="text-slate-400">Subnet: <strong className="text-cyan-400">192.168.50.1/24</strong></div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onFinish}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        {step < 10 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {step < 9 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinalApply}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Applying Configuration...' : 'Confirm & Launch Repeater'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
