import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  HardDrive,
  Info,
  Radio,
  RefreshCw,
  ShieldAlert,
  Terminal,
  Usb,
  Wifi,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { UsbWifiDevice, WifiInterface } from '../types';

interface InterfacesViewProps {
  interfaces: WifiInterface[];
  onSelectRole: (wanIface: string, apIface: string) => Promise<{ success: boolean; message: string }>;
}

export const InterfacesView: React.FC<InterfacesViewProps> = ({ interfaces, onSelectRole }) => {
  const currentWan = interfaces.find((i) => i.isWan)?.name || interfaces[0]?.name || 'wlan0';
  const currentAp = interfaces.find((i) => i.isAp)?.name || interfaces[1]?.name || 'wlan1';

  const [selectedWan, setSelectedWan] = useState<string>(currentWan);
  const [selectedAp, setSelectedAp] = useState<string>(currentAp);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // USB Devices state
  const [usbDevices, setUsbDevices] = useState<UsbWifiDevice[]>([]);
  const [scanningUsb, setScanningUsb] = useState<boolean>(false);

  const fetchUsbDevices = async () => {
    try {
      const data = await api.getUsbDevices();
      setUsbDevices(data);
    } catch {
      // fallback
    }
  };

  const handleRescanUsb = async () => {
    setScanningUsb(true);
    try {
      const res = await api.rescanUsbDevices();
      if (res.success) {
        setUsbDevices(res.devices);
        setActionMessage({ type: 'success', text: `USB bus scanned: ${res.devices.length} Wi-Fi adapter(s) found.` });
      }
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'USB rescan failed' });
    } finally {
      setScanningUsb(false);
    }
  };

  useEffect(() => {
    fetchUsbDevices();
  }, []);

  const selectedWanObj = interfaces.find((i) => i.name === selectedWan);
  const selectedApObj = interfaces.find((i) => i.name === selectedAp);

  // Safety logic
  const isSameInterface = selectedWan === selectedAp;
  const sameInterfaceSupported = selectedWanObj?.concurrentApStaSupport || false;

  const handleApply = async () => {
    setIsApplying(true);
    setActionMessage(null);
    try {
      const res = await onSelectRole(selectedWan, selectedAp);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to apply roles' });
    } finally {
      setIsApplying(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">Dynamic Wireless Hardware Detection: </span>
            The system inspects kernel sysfs, <code className="text-cyan-400 font-mono">iw phy</code>, and ethtool to determine driver limits. The built-in Wi-Fi providing your Internet route is locked as protected WAN by default.
          </div>
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
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Role Assignment Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-1">Wireless Interface Role Assignment</h3>
        <p className="text-xs text-slate-400 mb-4">
          Assign which physical interface acts as the WAN uplink to the Internet and which operates the downstream Access Point.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WAN Interface Selector */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Internet / WAN Interface (Uplink)
            </label>
            <select
              value={selectedWan}
              onChange={(e) => setSelectedWan(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} ({iface.chipset}) {iface.isDefaultRoute ? '★ [Default Gateway]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Current route:{' '}
              <strong className="text-slate-200 font-mono">
                {selectedWanObj?.ipAddress || 'DHCP Unassigned'}
              </strong>
            </p>
          </div>

          {/* AP Interface Selector */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Access Point Interface (Downlink Hotspot)
            </label>
            <select
              value={selectedAp}
              onChange={(e) => setSelectedAp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name} ({iface.chipset}) {iface.isRtl8821c ? '⚡ [RTL8821C Adapter]' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              AP Subnet will bind to this interface (e.g. <span className="font-mono text-cyan-400">192.168.50.1/24</span>)
            </p>
          </div>
        </div>

        {/* Safety Warning if same interface selected without hardware concurrency */}
        {isSameInterface && !sameInterfaceSupported && (
          <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <span className="font-semibold text-rose-200">Hardware Conflict: </span>
              Interface <code className="font-mono">{selectedWan}</code> cannot be used simultaneously for both WAN and AP because driver <code className="font-mono">{selectedWanObj?.driver}</code> lacks concurrent STA+AP virtual interface support. You must choose two separate adapters (Mode A).
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSameInterface && !sameInterfaceSupported}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Review & Apply Interface Roles
          </button>
        </div>
      </div>

      {/* Detected Hardware Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {interfaces.map((iface) => (
          <div
            key={iface.name}
            className={`p-6 rounded-xl bg-slate-900 border transition-colors ${
              iface.name === selectedWan
                ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                : iface.name === selectedAp
                ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                : 'border-slate-800'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{iface.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{iface.phy} · MAC: {iface.mac}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5">
                {iface.isWan && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    WAN UPLINK
                  </span>
                )}
                {iface.isAp && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    AP ACTIVE
                  </span>
                )}
              </div>
            </div>

            {/* Hardware Specs Table */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Chipset Identification</span>
                <span className="text-white font-medium">{iface.chipset}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Kernel Module / Driver</span>
                <span className="text-cyan-400 font-mono">{iface.driver}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">PCI / USB Hardware ID</span>
                <span className="text-slate-300 font-mono">{iface.pciUsbId}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Supported Wireless Modes</span>
                <span className="text-slate-300 font-mono">{iface.supportedModes.join(', ')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Supported Bands</span>
                <span className="text-slate-300 font-medium">{iface.bands.join(', ')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Channel Widths</span>
                <span className="text-slate-300 font-mono">{iface.channelWidths.join(', ')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Concurrent AP + STA Mode</span>
                <span className={`font-mono font-medium ${iface.concurrentApStaSupport ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {iface.concurrentApStaSupport ? 'Supported (Virtual PHY)' : 'Unsupported (Single Radio)'}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Max Tx Power</span>
                <span className="text-slate-300 font-mono">{iface.maxTxPowerDbm} dBm</span>
              </div>
            </div>

            {/* Channels List */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Supported Channels:</span>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {iface.channels.map((ch) => (
                  <span key={ch} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* USB Wi-Fi Dongles & Hardware Hotplug Auto-Discovery */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">USB Wi-Fi Cards Auto-Discovery & Validation</h3>
              <p className="text-xs text-slate-400">
                Plug in any USB Wi-Fi adapter (Realtek, MediaTek, Atheros, Ralink, etc.). The dashboard audits AP mode support.
              </p>
            </div>
          </div>

          <button
            onClick={handleRescanUsb}
            disabled={scanningUsb}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanningUsb ? 'animate-spin' : ''}`} />
            <span>{scanningUsb ? 'Scanning USB Bus...' : 'Rescan USB Ports'}</span>
          </button>
        </div>

        {usbDevices.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
            No USB Wi-Fi adapters detected on USB bus. Plug in a USB wireless card and click &quot;Rescan USB Ports&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usbDevices.map((dev) => (
              <div key={dev.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{dev.productName}</h4>
                    <span className="text-[11px] font-mono text-cyan-400">
                      ID {dev.vendorId}:{dev.productId} (Bus {dev.busNum} Dev {dev.devNum})
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${
                      dev.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {dev.status === 'ready' ? 'Ready for AP' : 'Driver Needed'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mapped Interface:</span>
                    <span className="text-slate-200 font-mono font-medium">{dev.interfaceName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kernel Driver:</span>
                    <span className="text-cyan-400 font-mono">{dev.driver || 'Generic nl80211'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AP Mode Support:</span>
                    <span className={`font-mono ${dev.apSupported ? 'text-emerald-400 font-medium' : 'text-rose-400'}`}>
                      {dev.apSupported ? 'Supported (Valid for Repeater)' : 'Managed Only'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bands:</span>
                    <span className="text-slate-300 font-mono">{dev.dualBand ? 'Dual-Band 2.4GHz + 5GHz' : '2.4GHz Single-Band'}</span>
                  </div>
                </div>

                {dev.setupInstructions && (
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-slate-300">Driver status:</strong> {dev.setupInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-semibold text-white">Confirm Network Configuration Change</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Applying these roles will update system routing and network daemon assignments:
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">WAN Interface:</span>
                <span className="text-emerald-400 font-bold">{selectedWan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AP Interface:</span>
                <span className="text-cyan-400 font-bold">{selectedAp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Firewall Table:</span>
                <span className="text-slate-300">wifi_dashboard_nat</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Your primary Internet connection on <strong className="text-white">{selectedWan}</strong> will remain active. The secondary interface <strong className="text-white">{selectedAp}</strong> will be isolated for client broadcasting.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isApplying ? 'Applying...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
