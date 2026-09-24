import {
  ApConfig,
  ClientDevice,
  DiagnosticCheck,
  LogEntry,
  NetworkConfig,
  RepeaterConfig,
  ScanResult,
  SystemStatus,
  TailscaleStatus,
  TerminalCommandResult,
  UsbWifiDevice,
  WifiInterface,
  OfflineStatus,
} from '../types';

export const api = {
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/status');
    const json = await res.json();
    return json.data;
  },

  async getInterfaces(): Promise<WifiInterface[]> {
    const res = await fetch('/api/interfaces');
    const json = await res.json();
    return json.data;
  },

  async scanWifi(iface?: string): Promise<ScanResult[]> {
    const url = iface ? `/api/wifi/scan?interface=${encodeURIComponent(iface)}` : '/api/wifi/scan';
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async getClients(): Promise<ClientDevice[]> {
    const res = await fetch('/api/clients');
    const json = await res.json();
    return json.data;
  },

  async blockClient(mac: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(mac)}/block`, { method: 'POST' });
    return res.json();
  },

  async unblockClient(mac: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(mac)}/unblock`, { method: 'POST' });
    return res.json();
  },

  async disconnectClient(mac: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(mac)}/disconnect`, { method: 'POST' });
    return res.json();
  },

  async getApConfig(): Promise<ApConfig> {
    const res = await fetch('/api/ap/config');
    const json = await res.json();
    return json.data;
  },

  async updateApConfig(config: Partial<ApConfig>): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/ap/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async startAp(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/ap/start', { method: 'POST' });
    return res.json();
  },

  async stopAp(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/ap/stop', { method: 'POST' });
    return res.json();
  },

  async getRepeaterConfig(): Promise<RepeaterConfig> {
    const res = await fetch('/api/repeater/config');
    const json = await res.json();
    return json.data;
  },

  async configureRepeater(config: RepeaterConfig): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/repeater/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getNetworkConfig(): Promise<NetworkConfig> {
    const res = await fetch('/api/network');
    const json = await res.json();
    return json.data;
  },

  async updateNetworkConfig(config: Partial<NetworkConfig>): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/network/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getFirewallDetails(): Promise<{ tableName: string; ipv4ForwardingEnabled: boolean; masqueradeActive: boolean; rulesetText: string }> {
    const res = await fetch('/api/firewall');
    const json = await res.json();
    return json.data;
  },

  async getDiagnostics(): Promise<DiagnosticCheck[]> {
    const res = await fetch('/api/diagnostics');
    const json = await res.json();
    return json.data;
  },

  async getLogs(): Promise<LogEntry[]> {
    const res = await fetch('/api/logs');
    const json = await res.json();
    return json.data;
  },

  async clearLogs(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/logs', { method: 'DELETE' });
    return res.json();
  },

  async executeTerminal(command: string): Promise<TerminalCommandResult> {
    const res = await fetch('/api/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    const json = await res.json();
    return json.data;
  },

  async toggleMockMode(enabled: boolean): Promise<{ success: boolean; mockMode: boolean }> {
    const res = await fetch('/api/system/mock-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return res.json();
  },

  async importConfig(data: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTailscaleStatus(): Promise<TailscaleStatus> {
    const res = await fetch('/api/tailscale');
    const json = await res.json();
    return json.data;
  },

  async toggleTailscale(up: boolean): Promise<{ success: boolean; message: string; status: TailscaleStatus }> {
    const res = await fetch('/api/tailscale/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ up }),
    });
    return res.json();
  },

  async updateTailscaleSettings(settings: Partial<TailscaleStatus>): Promise<{ success: boolean; data: TailscaleStatus }> {
    const res = await fetch('/api/tailscale/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async getUsbDevices(): Promise<UsbWifiDevice[]> {
    const res = await fetch('/api/usb-devices');
    const json = await res.json();
    return json.data;
  },

  async rescanUsbDevices(): Promise<{ success: boolean; devices: UsbWifiDevice[] }> {
    const res = await fetch('/api/usb-devices/rescan', { method: 'POST' });
    return res.json();
  },

  async getOfflineStatus(): Promise<OfflineStatus> {
    const res = await fetch('/api/offline-status');
    const json = await res.json();
    return json.data;
  },
};
