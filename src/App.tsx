/**
 * Linux AMD64 Wi-Fi Repeater & Access Point Management Dashboard
 * Main Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ApConfig,
  ClientDevice,
  NetworkConfig,
  RepeaterConfig,
  ScanResult,
  SystemStatus,
  ViewTab,
  WifiInterface,
} from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InterfacesView } from './components/InterfacesView';
import { RepeaterWizard } from './components/RepeaterWizard';
import { AccessPointView } from './components/AccessPointView';
import { ScannerView } from './components/ScannerView';
import { ClientsView } from './components/ClientsView';
import { NetworkView } from './components/NetworkView';
import { FirewallView } from './components/FirewallView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { LogsView } from './components/LogsView';
import { TerminalView } from './components/TerminalView';
import { SettingsView } from './components/SettingsView';
import { TailscaleView } from './components/TailscaleView';
import { DeploymentView } from './components/DeploymentView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [interfaces, setInterfaces] = useState<WifiInterface[]>([]);
  const [apConfig, setApConfig] = useState<ApConfig | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
  const [clients, setClients] = useState<ClientDevice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all initial state
  const loadInitialData = useCallback(async () => {
    try {
      const [statusData, ifacesData, apData, netData, clientsData] = await Promise.all([
        api.getStatus(),
        api.getInterfaces(),
        api.getApConfig(),
        api.getNetworkConfig(),
        api.getClients(),
      ]);
      setStatus(statusData);
      setInterfaces(ifacesData);
      setApConfig(apData);
      setNetworkConfig(netData);
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling for real-time throughput & telemetry
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [statusData, clientsData] = await Promise.all([
          api.getStatus(),
          api.getClients(),
        ]);
        setStatus(statusData);
        setClients(clientsData);
      } catch {
        // ignore polling errors
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleToggleMock = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await api.toggleMockMode(enabled);
      await loadInitialData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAp = async () => {
    if (!status) return { success: false, message: 'Status unavailable' };
    try {
      const res = status.apStatus === 'running' ? await api.stopAp() : await api.startAp();
      const updatedStatus = await api.getStatus();
      setStatus(updatedStatus);
      return res;
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Toggle failed' };
    }
  };

  const handleSaveApConfig = async (newConfig: Partial<ApConfig>) => {
    const res = await api.updateApConfig(newConfig);
    if (res.success) {
      const updatedAp = await api.getApConfig();
      setApConfig(updatedAp);
      const updatedStatus = await api.getStatus();
      setStatus(updatedStatus);
    }
    return res;
  };

  const handleSelectRoles = async (wanIface: string, apIface: string) => {
    const res = await api.updateApConfig({ interface: apIface });
    if (res.success) {
      await loadInitialData();
    }
    return res;
  };

  const handleApplyRepeater = async (config: RepeaterConfig) => {
    const res = await api.configureRepeater(config);
    if (res.success) {
      await loadInitialData();
    }
    return res;
  };

  const handleSaveNetwork = async (newConfig: Partial<NetworkConfig>) => {
    const res = await api.updateNetworkConfig(newConfig);
    if (res.success) {
      const updatedNet = await api.getNetworkConfig();
      setNetworkConfig(updatedNet);
    }
    return res;
  };

  const handleBlockClient = async (mac: string) => {
    const res = await api.blockClient(mac);
    if (res.success) {
      const updatedClients = await api.getClients();
      setClients(updatedClients);
    }
    return res;
  };

  const handleUnblockClient = async (mac: string) => {
    const res = await api.unblockClient(mac);
    if (res.success) {
      const updatedClients = await api.getClients();
      setClients(updatedClients);
    }
    return res;
  };

  const handleDisconnectClient = async (mac: string) => {
    const res = await api.disconnectClient(mac);
    if (res.success) {
      const updatedClients = await api.getClients();
      setClients(updatedClients);
    }
    return res;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        status={status}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        <Header
          currentTab={currentTab}
          status={status}
          onRefresh={loadInitialData}
          isLoading={isLoading}
          onToggleMock={handleToggleMock}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                status={status}
                interfaces={interfaces}
                onNavigate={(tab) => setCurrentTab(tab)}
                onToggleAp={handleToggleAp}
              />
            )}

            {currentTab === 'interfaces' && (
              <InterfacesView
                interfaces={interfaces}
                onSelectRole={handleSelectRoles}
              />
            )}

            {currentTab === 'repeater' && (
              <RepeaterWizard
                interfaces={interfaces}
                onScanWifi={(iface) => api.scanWifi(iface)}
                onApplyRepeater={handleApplyRepeater}
                onFinish={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'ap' && apConfig && (
              <AccessPointView
                config={apConfig}
                interfaces={interfaces}
                apStatus={status?.apStatus || 'stopped'}
                onSaveConfig={handleSaveApConfig}
                onToggleAp={handleToggleAp}
              />
            )}

            {currentTab === 'scanner' && (
              <ScannerView
                interfaces={interfaces}
                onScan={(iface) => api.scanWifi(iface)}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'clients' && (
              <ClientsView
                clients={clients}
                onBlock={handleBlockClient}
                onUnblock={handleUnblockClient}
                onDisconnect={handleDisconnectClient}
              />
            )}

            {currentTab === 'network' && networkConfig && (
              <NetworkView
                config={networkConfig}
                onSaveNetwork={handleSaveNetwork}
              />
            )}

            {currentTab === 'tailscale' && <TailscaleView />}

            {currentTab === 'deployment' && <DeploymentView />}

            {currentTab === 'firewall' && <FirewallView />}

            {currentTab === 'diagnostics' && <DiagnosticsView />}

            {currentTab === 'logs' && <LogsView />}

            {currentTab === 'terminal' && <TerminalView />}

            {currentTab === 'settings' && (
              <SettingsView
                isMockMode={status?.isMockMode || false}
                onToggleMock={handleToggleMock}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
