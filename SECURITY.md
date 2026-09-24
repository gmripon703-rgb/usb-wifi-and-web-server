# Security Policy & Hardening Model

## Core Principles

1. **Privilege Separation & Least Privilege**:
   - The dashboard web server communicates with the network stack via specific, allowlisted commands.
   - Sudo rules (`/etc/sudoers.d/010_wifi-dashboard`) only permit executing designated networking utilities with explicit argument formats.
   - The web terminal prohibits arbitrary bash shell commands, piping, arbitrary script execution, or unauthenticated root shells.

2. **Network Isolation**:
   - The web dashboard binds strictly to `127.0.0.1` (localhost) by default.
   - Never expose port 8080 to the public WAN interface.
   - Firewall changes are strictly encapsulated within `table inet wifi_dashboard_nat`.

3. **Protection of Credentials**:
   - Passwords and WPA passphrases are never emitted in plain text in general status endpoints or unauthenticated responses.
   - Configuration exports mask sensitive credentials by default unless explicitly exported in insecure mode by the administrator.

4. **Input Validation**:
   - All network inputs (IP addresses, CIDR masks, SSID strings, country codes, MAC addresses) are validated against strict regex schemas.
