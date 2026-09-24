# Contributing Guidelines

Thank you for contributing to the Linux AMD64 Wi-Fi Repeater & AP Management Dashboard.

## Development Setup
```bash
# Clone the repository
git clone https://github.com/your-org/wifi-dashboard.git
cd wifi-dashboard

# Install dependencies
npm install

# Start development server (with full mock simulation engine)
npm run dev
```

## Testing Protocol
- Run typecheck and linting:
  ```bash
  npm run lint
  ```
- Run test suite:
  ```bash
  npx tsx tests/validator.test.ts
  ```
- Never commit hardcoded network passwords or private keys.
- Ensure all Linux shell scripts pass shellcheck guidelines and include safety comments.
