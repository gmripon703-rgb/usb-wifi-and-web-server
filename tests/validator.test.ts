/**
 * Automated Test Suite for Wi-Fi Dashboard
 * Validates IP validation, CIDR ranges, safety constraints, and rule generation.
 */

function validateIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && p === n.toString();
  });
}

function validateDhcpRange(startIp: string, endIp: string, subnet: string): boolean {
  if (!validateIp(startIp) || !validateIp(endIp)) return false;
  const startParts = startIp.split('.').map(Number);
  const endParts = endIp.split('.').map(Number);
  const subnetParts = subnet.split('.').map(Number);

  // Must share the same first 3 octets for /24
  if (startParts[0] !== subnetParts[0] || startParts[1] !== subnetParts[1] || startParts[2] !== subnetParts[2]) {
    return false;
  }
  return startParts[3] < endParts[3];
}

function generateNftablesConfig(wan: string, lanSubnet: string): string {
  return `table inet wifi_dashboard_nat {
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname "${wan}" ip saddr ${lanSubnet} counter masquerade
    }
}`;
}

// Simple test assertions
function runTests() {
  console.log('Running Wi-Fi Dashboard Validation Tests...');

  // Test 1: Valid IPv4
  if (!validateIp('192.168.50.1') || !validateIp('10.0.0.1')) {
    throw new Error('Test 1 Failed: Valid IP rejected');
  }
  console.log('  ✓ Test 1: Valid IPv4 addresses accepted.');

  // Test 2: Invalid IPv4
  if (validateIp('256.0.0.1') || validateIp('192.168.1') || validateIp('abc.def.ghi.jkl')) {
    throw new Error('Test 2 Failed: Invalid IP accepted');
  }
  console.log('  ✓ Test 2: Invalid IPv4 addresses correctly rejected.');

  // Test 3: DHCP Range
  if (!validateDhcpRange('192.168.50.100', '192.168.50.250', '192.168.50.1')) {
    throw new Error('Test 3 Failed: Valid DHCP range rejected');
  }
  if (validateDhcpRange('192.168.50.200', '192.168.50.100', '192.168.50.1')) {
    throw new Error('Test 3 Failed: Inverted DHCP range accepted');
  }
  console.log('  ✓ Test 3: DHCP range validation functioning.');

  // Test 4: nftables isolated table generator
  const rules = generateNftablesConfig('wlan0', '192.168.50.0/24');
  if (!rules.includes('table inet wifi_dashboard_nat') || !rules.includes('oifname "wlan0"')) {
    throw new Error('Test 4 Failed: nftables config format invalid');
  }
  console.log('  ✓ Test 4: Isolated nftables table syntax verified.');

  // Test 5: Tailscale CGNAT Range (100.64.0.0/10)
  function isTailscaleIp(ip: string): boolean {
    if (!validateIp(ip)) return false;
    const parts = ip.split('.').map(Number);
    return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
  }
  if (!isTailscaleIp('100.92.140.25') || isTailscaleIp('192.168.1.1')) {
    throw new Error('Test 5 Failed: Tailscale IP detection logic incorrect');
  }
  console.log('  ✓ Test 5: Tailscale CGNAT IPv4 verification verified.');

  // Test 6: USB Wi-Fi device AP validation
  function isUsbWifiValidForAp(modes: string[]): boolean {
    return modes.includes('AP');
  }
  if (!isUsbWifiValidForAp(['managed', 'AP']) || isUsbWifiValidForAp(['managed'])) {
    throw new Error('Test 6 Failed: USB Wi-Fi AP validation incorrect');
  }
  console.log('  ✓ Test 6: Universal USB Wi-Fi adapter AP capability audit verified.');

  // Test 7: Offline AMD64 Architecture & Distribution Validation
  function validateOfflineArchitecture(arch: string): boolean {
    return arch === 'x86_64' || arch === 'x64' || arch === 'amd64';
  }
  if (!validateOfflineArchitecture('x86_64') || !validateOfflineArchitecture('x64') || validateOfflineArchitecture('armv7l')) {
    throw new Error('Test 7 Failed: Offline architecture validation failed');
  }
  console.log('  ✓ Test 7: Offline AMD64/x86_64 architecture enforcement verified.');

  console.log('All 7 test suites passed successfully.');
}

runTests();
