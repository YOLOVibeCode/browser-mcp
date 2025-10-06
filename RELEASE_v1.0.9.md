# Browser MCP v1.0.9 Release Notes

**Release Date:** October 6, 2025

---

## 🎉 Major Release: NPM-Ready Companion App with E2E Testing

Version 1.0.9 makes Browser MCP production-ready with a publishable NPM companion app, comprehensive E2E testing, and simplified documentation.

---

## ✨ New Features

### 1. NPM-Ready Companion App

**Package:** `@browser-mcp/companion`

A production-ready Node.js companion app for easy server startup:

```bash
npm install -g @browser-mcp/companion
browser-mcp-companion
```

**Features:**
- ✅ One-command server startup
- ✅ Auto-detection health check endpoint (port 3100)
- ✅ Beautiful status page
- ✅ Graceful shutdown
- ✅ Ready for NPM publication

**Documentation:**
- [companion-app/README.md](companion-app/README.md) - Usage guide
- [companion-app/NPM_PUBLISH.md](companion-app/NPM_PUBLISH.md) - Publishing instructions

### 2. End-to-End Testing Suite

**162 total tests** including:
- 155 unit/integration tests
- **7 new E2E tests** with Playwright

**E2E Test Coverage:**
- ✅ Companion app startup/shutdown
- ✅ Extension loading in Chrome
- ✅ Server health check detection
- ✅ Complete connection flow
- ✅ Tab connection/disconnection
- ✅ Port allocation verification

**Run Tests:**
```bash
# Smoke tests
npm run test:e2e:smoke

# Full connection flow
npm run test:e2e:connection
```

### 3. Setup Guide in Extension

Interactive step-by-step guide built into the Chrome extension:

- **Auto-detects** running MCP server
- **Real-time status updates** (checks every 3s)
- **Clear instructions** for each step
- **Beautiful UI** with status indicators

Access via extension popup: "📖 View Setup Guide"

### 4. Updated Documentation

**Main README:**
- Concise 2-minute quick start
- Clear IDE integration links (Claude Code, Claude Desktop, Cursor, Windsurf)
- NPM installation instructions
- Simplified architecture overview

**New Docs:**
- [companion-app/README.md](companion-app/README.md) - Companion app guide
- [companion-app/NPM_PUBLISH.md](companion-app/NPM_PUBLISH.md) - NPM publishing
- Updated [QUICKSTART.md](QUICKSTART.md) with companion app

---

## 🔧 Technical Improvements

### Architecture
- **Companion app**: Express server with CORS, health checks, status page
- **E2E tests**: Real Chrome browser, actual server startup/shutdown
- **Build improvements**: test-popup.js now properly copied to dist

### Code Quality
- All E2E tests passing in CI/CD ready state
- Proper error handling and graceful shutdown
- TypeScript definitions for companion app

### Documentation
- README reduced from 350+ to 235 lines
- Clear separation of concerns (quick start vs deep dive)
- Direct links to IDE-specific guides
- NPM badges added

---

## 📦 What's Included

### Packages
- `@browser-mcp/companion` - **NEW** NPM companion app
- `@browser-mcp/contracts` - TypeScript interfaces (v1.0.9)
- `@browser-mcp/infrastructure` - Core implementations (v1.0.9)
- `@browser-mcp/mcp-server` - MCP server (v1.0.9)
- `@browser-mcp/extension-chromium` - Chrome extension (v1.0.9)
- `@browser-mcp/test-harnesses` - Test infrastructure (v1.0.9)

### Files Changed
- 717 files changed
- 73,756 insertions
- 263 deletions

---

## 🚀 Getting Started

### Quick Start (New Users)

```bash
# 1. Install companion app
npm install -g @browser-mcp/companion

# 2. Start server
browser-mcp-companion

# 3. Install Chrome extension
# - Open chrome://extensions/
# - Load unpacked: extension-chromium/dist/

# 4. Connect a tab
# - Click extension icon
# - Click "Connect This Tab"
```

### Upgrading from 1.0.8

```bash
# Pull latest
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Install companion app (optional)
npm install -g @browser-mcp/companion
```

---

## 📚 Documentation Updates

### Updated Files
- [README.md](README.md) - Complete rewrite, concise and clear
- [QUICKSTART.md](QUICKSTART.md) - Added companion app instructions
- [companion-app/README.md](companion-app/README.md) - **NEW** NPM package docs
- [companion-app/NPM_PUBLISH.md](companion-app/NPM_PUBLISH.md) - **NEW** Publishing guide

### Preserved Files
- [START_HERE.md](START_HERE.md) - Automated setup script
- [CURSOR_INTEGRATION.md](CURSOR_INTEGRATION.md) - Cursor IDE setup
- [WINDSURF_INTEGRATION.md](WINDSURF_INTEGRATION.md) - Windsurf IDE setup
- [TAB_PINNING_GUIDE.md](TAB_PINNING_GUIDE.md) - Session management
- [TESTING.md](TESTING.md) - Comprehensive testing guide

---

## 🎯 Next Steps

### For End Users
1. Install: `npm install -g @browser-mcp/companion`
2. Run: `browser-mcp-companion`
3. Connect browser tabs
4. Use with your favorite AI assistant

### For Contributors
1. Publish companion app to NPM (see NPM_PUBLISH.md)
2. Run E2E tests: `npm run test:e2e`
3. Improve documentation
4. Add more features

### For Maintainers
**Publishing to NPM:**
```bash
cd companion-app
npm login
npm publish --access public
```

**Creating Releases:**
```bash
git tag v1.0.9
git push origin v1.0.9
```

---

## 🐛 Bug Fixes

- Fixed test-popup.js not being copied to dist
- Fixed port 3100 conflicts in E2E tests
- Fixed extension reload issues
- Improved error handling in companion app

---

## ⚠️ Breaking Changes

None. This release is fully backward compatible with 1.0.8.

---

## 📊 Testing

**Test Results:**
```
162 total tests passing
├── 155 unit/integration tests
└── 7 E2E tests (Playwright)
    ├── 6 smoke tests
    └── 1 connection flow test
```

**Test Commands:**
```bash
npm test               # All unit tests
npm run test:e2e      # All E2E tests
npm run test:e2e:smoke       # Smoke tests only
npm run test:e2e:connection  # Connection flow only
```

---

## 🤝 Contributing

See [TESTING.md](TESTING.md) for comprehensive testing guide.

**TDD Workflow:**
1. Write tests first (RED)
2. Implement to pass (GREEN)
3. Refactor (REFACTOR)

---

## 📝 License

MIT © Browser MCP Contributors

---

## 🎊 Acknowledgments

Built with:
- TypeScript 5.3+
- Playwright 1.55.1
- Vitest 1.0.0
- Express 4.18.2
- Chrome Manifest v3

---

**Thank you for using Browser MCP!** 🚀

[NPM Package](https://www.npmjs.com/package/@browser-mcp/companion) | [GitHub](https://github.com/YOLOVibeCode/browser-mcp) | [Documentation](./README.md)
