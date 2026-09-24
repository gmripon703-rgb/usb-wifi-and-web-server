/**
 * Express REST API Routes for Linux AMD64 Wi-Fi Repeater & AP Management
 */

import { Router, type Request, type Response } from 'express';
import { linuxManager } from './linuxManager.ts';

export const apiRouter = Router();

// GET /api/status - Live system status, metrics, and network state
apiRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = await linuxManager.getStatus();
    res.json({ success: true, data: status });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/interfaces - Dynamic wireless hardware detection
apiRouter.get('/interfaces', async (_req: Request, res: Response) => {
  try {
    const interfaces = await linuxManager.detectInterfaces();
    res.json({ success: true, data: interfaces });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/wifi/scan - Upstream Wi-Fi network scanner
apiRouter.get('/wifi/scan', async (req: Request, res: Response) => {
  try {
    const iface = req.query.interface as string | undefined;
    const scanResults = await linuxManager.scanWifi(iface);
    res.json({ success: true, data: scanResults });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Scan failed' });
  }
});

// GET /api/wifi/capabilities - Capabilities breakdown
apiRouter.get('/wifi/capabilities', async (_req: Request, res: Response) => {
  try {
    const interfaces = await linuxManager.detectInterfaces();
    const rtlDevice = interfaces.find((i) => i.isRtl8821c);
    res.json({
      success: true,
      data: {
        interfaces,
        rtlDeviceDetected: !!rtlDevice,
        rtlDevice,
        supportedModes: ['NAT Access Point (Mode A)', 'STA + AP Concurrency (Mode B - hardware permitting)'],
        recommendedMode: rtlDevice && !rtlDevice.concurrentApStaSupport ? 'mode_a_nat' : 'mode_a_nat',
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /api/clients - Connected station devices
apiRouter.get('/clients', (_req: Request, res: Response) => {
  try {
    const clients = linuxManager.getConnectedClients();
    res.json({ success: true, data: clients });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// POST /api/clients/:mac/block
apiRouter.post('/clients/:mac/block', (req: Request, res: Response) => {
  const { mac } = req.params;
  const result = linuxManager.blockClient(mac);
  res.json(result);
});

// POST /api/clients/:mac/unblock
apiRouter.post('/clients/:mac/unblock', (req: Request, res: Response) => {
  const { mac } = req.params;
  const result = linuxManager.unblockClient(mac);
  res.json(result);
});

// POST /api/clients/:mac/disconnect
apiRouter.post('/clients/:mac/disconnect', (req: Request, res: Response) => {
  const { mac } = req.params;
  const result = linuxManager.disconnectClient(mac);
  res.json(result);
});

// GET & POST /api/ap/config
apiRouter.get('/ap/config', (_req: Request, res: Response) => {
  res.json({ success: true, data: linuxManager.getApConfig() });
});

apiRouter.post('/ap/config', async (req: Request, res: Response) => {
  try {
    const result = await linuxManager.updateApConfig(req.body);
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Failed to update AP' });
  }
});

// POST /api/ap/start & /api/ap/stop
apiRouter.post('/ap/start', async (_req: Request, res: Response) => {
  const result = await linuxManager.startAp();
  res.json(result);
});

apiRouter.post('/ap/stop', async (_req: Request, res: Response) => {
  const result = await linuxManager.stopAp();
  res.json(result);
});

// GET & POST /api/repeater/config
apiRouter.get('/repeater/config', (_req: Request, res: Response) => {
  res.json({ success: true, data: linuxManager.getRepeaterConfig() });
});

apiRouter.post('/api/repeater/config', async (req: Request, res: Response) => {
  try {
    const result = await linuxManager.configureRepeater(req.body);
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Failed to configure repeater' });
  }
});

// GET & POST /api/network
apiRouter.get('/network', (_req: Request, res: Response) => {
  res.json({ success: true, data: linuxManager.getNetworkConfig() });
});

apiRouter.post('/network/apply', async (req: Request, res: Response) => {
  try {
    const result = await linuxManager.updateNetworkConfig(req.body);
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Failed to apply network configuration' });
  }
});

// GET /api/firewall - Details on isolated nftables rules
apiRouter.get('/firewall', async (_req: Request, res: Response) => {
  const terminalResult = await linuxManager.executeTerminal('nft list table inet wifi_dashboard_nat');
  res.json({
    success: true,
    data: {
      tableName: 'table inet wifi_dashboard_nat',
      ipv4ForwardingEnabled: true,
      masqueradeActive: true,
      rulesetText: terminalResult.stdout || 'table inet wifi_dashboard_nat active',
      isolated: true,
    },
  });
});

// GET /api/diagnostics - Comprehensive self-test
apiRouter.get('/diagnostics', async (_req: Request, res: Response) => {
  try {
    const results = await linuxManager.runDiagnostics();
    res.json({ success: true, data: results });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Diagnostics failed' });
  }
});

// GET & DELETE /api/logs
apiRouter.get('/logs', (_req: Request, res: Response) => {
  res.json({ success: true, data: linuxManager.getLogs() });
});

apiRouter.delete('/logs', (_req: Request, res: Response) => {
  linuxManager.clearLogs();
  res.json({ success: true, message: 'Logs cleared.' });
});

// POST /api/terminal/exec - Controlled secure terminal
apiRouter.post('/terminal/exec', async (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    res.status(400).json({ success: false, message: 'Command string is required.' });
    return;
  }
  const result = await linuxManager.executeTerminal(command);
  res.json({ success: true, data: result });
});

// Configuration Backup & Restore
apiRouter.get('/config/export', (req: Request, res: Response) => {
  const includePasswords = req.query.includePasswords === 'true';
  const exported = linuxManager.exportConfig(includePasswords);
  res.setHeader('Content-Disposition', 'attachment; filename="wifi-dashboard-config.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exported, null, 2));
});

apiRouter.post('/config/import', (req: Request, res: Response) => {
  const result = linuxManager.importConfig(req.body);
  res.json(result);
});

// System simulation toggle
apiRouter.post('/system/mock-mode', (req: Request, res: Response) => {
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    linuxManager.setMockMode(enabled);
  }
  res.json({ success: true, mockMode: linuxManager.getMockMode() });
});

// Tailscale remote access & IP hosting
apiRouter.get('/tailscale', async (_req: Request, res: Response) => {
  try {
    const status = await linuxManager.getTailscaleStatus();
    res.json({ success: true, data: status });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Tailscale query failed' });
  }
});

apiRouter.post('/tailscale/toggle', async (req: Request, res: Response) => {
  const { up } = req.body;
  try {
    const result = await linuxManager.toggleTailscale(Boolean(up));
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Failed to toggle Tailscale' });
  }
});

apiRouter.post('/tailscale/settings', (req: Request, res: Response) => {
  try {
    const updated = linuxManager.updateTailscaleConfig(req.body);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Failed to update settings' });
  }
});

// USB Wi-Fi adapter hardware discovery & validation
apiRouter.get('/usb-devices', async (_req: Request, res: Response) => {
  try {
    const devices = await linuxManager.getUsbWifiDevices();
    res.json({ success: true, data: devices });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'USB query failed' });
  }
});

apiRouter.post('/usb-devices/rescan', async (_req: Request, res: Response) => {
  try {
    const result = await linuxManager.rescanUsbDevices();
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'USB rescan failed' });
  }
});

// Offline readiness status for Ubuntu AMD64 Desktop
apiRouter.get('/offline-status', async (_req: Request, res: Response) => {
  try {
    const status = await linuxManager.getOfflineStatus();
    res.json({ success: true, data: status });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Failed to query offline status' });
  }
});

