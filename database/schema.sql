-- ==============================================================================
-- SQLite Schema for Linux Wi-Fi Dashboard
-- Stores configuration snapshots, client history, audit logs, and settings
-- ==============================================================================

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interfaces_cache (
    name TEXT PRIMARY KEY,
    mac TEXT NOT NULL,
    chipset TEXT,
    driver TEXT,
    phy TEXT,
    is_wan INTEGER DEFAULT 0,
    is_ap INTEGER DEFAULT 0,
    capabilities TEXT,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_history (
    mac TEXT PRIMARY KEY,
    hostname TEXT,
    last_ip TEXT,
    first_connected TIMESTAMP,
    last_connected TIMESTAMP,
    total_rx_bytes INTEGER DEFAULT 0,
    total_tx_bytes INTEGER DEFAULT 0,
    is_blocked INTEGER DEFAULT 0,
    block_reason TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT DEFAULT 'admin'
);

-- Seed initial default configuration
INSERT OR IGNORE INTO settings (key, value) VALUES
('country_code', 'US'),
('active_mode', 'mode_a_nat'),
('wan_interface', 'wlan0'),
('ap_interface', 'wlan1'),
('auto_recovery_enabled', '1');
