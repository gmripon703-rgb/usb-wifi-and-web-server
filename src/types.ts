export interface WifiInterface {
  name: string;
  mac: string;
  driver: string;
  chipset: string;
  phy: string;
  isUp: boolean;
  isWan: boolean;
  isAp: boolean;
  isDefaultRoute: boolean;
  ipAddress: string | null;
  supportedModes: string[];
  bands: string[];
  channels: number[];
  concurrentApStaSupport: boolean;
  maxTxPowerDbm: number;
  channelWidths: string[];
  pciUsbId: string;
  isRtl8821c: boolean;
  isUsbWifi?: boolean;
  usbVendorModel?: string;
  signalDbm?: number;
  ssid?: string;
  channel?: number;
}

export interface UsbWifiDevice {
  id: string;
  busNum: string;
  devNum: string;
  vendorId: string;
  productId: string;
  vendorName: string;
  productName: string;
  interfaceName?: string;
  driver?: string;
  driverLoaded: boolean;
  phy?: string;
  supportedModes: string[];
  apSupported: boolean;
  staSupported: boolean;
  dualBand: boolean;
  status: 'ready' | 'missing_driver' | 'blocked_rfkill' | 'needs_config';
  recommendedDriver?: string;
  setupInstructions?: string;
}

export interface TailscaleStatus {
  installed: boolean;
  running: boolean;
  tailscaleIp: string | null;
  tailscaleIpv6: string | null;
  hostname: string | null;
  magicDnsDomain: string | null;
  authUrl: string | null;
  webUiPort: number;
  bindAddress: string;
  allowTailscaleAccess: boolean;
}

export interface OfflineStatus {
  architecture: string;
  isAmd64: boolean;
  prebuiltDistFound: boolean;
  prebuiltServerFound: boolean;
  offlinePackagesFound: boolean;
  offlineDebCount: number;
  systemTools: {
    hostapd: boolean;
    dnsmasq: boolean;
    nftables: boolean;
    iw: boolean;
    rfkill: boolean;
    node: boolean;
    tailscale: boolean;
    networkManager: boolean;
  };
  usbToolsAvailable: boolean;
  isReadyForOffline: boolean;
  offlineInstallCommand: string;
  offlineRunCommand: string;
}

export interface SystemStatus {
  internetConnected: boolean;
  defaultGateway: string;
  wanInterface: string;
  wanIp: string;
  tailscaleIp?: string | null;
  dnsServers: string[];
  apStatus: 'stopped' | 'starting' | 'running' | 'error';
  apInterface: string;
  ssid: string;
  channel: number;
  band: '2.4GHz' | '5GHz';
  security: string;
  connectedClientsCount: number;
  totalRxBytes: number;
  totalTxBytes: number;
  rxRateBytesPerSec: number;
  txRateBytesPerSec: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramTotalMb: number;
  ramUsedMb: number;
  uptimeSeconds: number;
  activeMode: 'mode_a_nat' | 'mode_b_sta_ap' | 'standalone_ap' | 'inactive';
  warningMessage?: string;
  isMockMode: boolean;
}

export interface ApConfig {
  interface: string;
  ssid: string;
  password: string;
  countryCode: string;
  band: '2.4GHz' | '5GHz';
  channel: number;
  channelWidth: '20MHz' | '40MHz' | '80MHz';
  hiddenSsid: boolean;
  security: 'wpa2' | 'wpa3' | 'wpa2_wpa3';
  maxClients: number;
  beaconInterval: number;
  dtimPeriod: number;
  txPowerDbm: number;
}

export interface RepeaterConfig {
  wanInterface: string;
  apInterface: string;
  upstreamSsid: string;
  upstreamPassword?: string;
  downstreamSsid: string;
  downstreamPassword?: string;
  mode: 'mode_a_nat' | 'mode_b_sta_ap';
  channel: number;
  band: '2.4GHz' | '5GHz';
}

export interface NetworkConfig {
  lanIp: string;
  subnetMask: string;
  dhcpStart: string;
  dhcpEnd: string;
  leaseTime: string;
  gateway: string;
  dnsServers: string[];
  localHostname: string;
  dnsForwarding: boolean;
}

export interface ClientDevice {
  mac: string;
  ip: string;
  hostname: string;
  connectedSince: string;
  signalDbm: number;
  rxRateMbps: number;
  txRateMbps: number;
  rxBytes: number;
  txBytes: number;
  isBlocked: boolean;
}

export interface ScanResult {
  ssid: string;
  bssid: string;
  signalDbm: number;
  channel: number;
  frequencyMhz: number;
  security: string;
  band: '2.4GHz' | '5GHz';
  bandwidthMhz: number;
  qualityPercent: number;
}

export interface DiagnosticCheck {
  id: string;
  category: 'Hardware' | 'Driver' | 'Service' | 'Network' | 'Security';
  name: string;
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  detail: string;
  remediation: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'app' | 'hostapd' | 'dnsmasq' | 'NetworkManager' | 'nftables' | 'kernel';
  message: string;
}

export interface TerminalCommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  timestamp: string;
}

export type ViewTab =
  | 'dashboard'
  | 'interfaces'
  | 'repeater'
  | 'ap'
  | 'scanner'
  | 'clients'
  | 'network'
  | 'tailscale'
  | 'deployment'
  | 'firewall'
  | 'diagnostics'
  | 'logs'
  | 'terminal'
  | 'settings';
