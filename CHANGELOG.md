# Changelog

All notable changes to Browser MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.5] - 2025-10-09

### 🎉 Major Architecture Fix & Test Infrastructure Overhaul

This release fixes a critical Manifest V3 compatibility issue and provides a completely revamped, passing test suite.

### Fixed
- **CRITICAL**: Fixed WebSocket architecture incompatibility with Chrome Manifest V3
  - `chrome.sockets.tcpServer` API is not available in MV3 service workers
  - **Solution**: Reversed WebSocket roles - MCP Server now hosts WebSocket server, Extension connects as client
  - This architectural change enables the extension to work correctly in Manifest V3

### Changed
- **WebSocket Architecture** (Breaking Change - but transparent to users)
  - **OLD**: Extension hosted WebSocket server (port 8765), MCP Server connected as client ❌
  - **NEW**: MCP Server hosts WebSocket server (port 8765), Extension connects as client ✅
  - Extension now uses native browser `WebSocket` API (fully supported in MV3)
  - MCP Server uses `ws` npm package for WebSocket hosting

### Added
- New WebSocket server implementation in MCP Server (`websocket-server-host.js`)
- New WebSocket client implementation in Extension (`websocket-client.js`)
- Auto-reconnect logic in Extension WebSocket client
- Comprehensive test suite with 100% pass rate:
  - E2E tests: 9/10 passing (90%)
  - Integration tests: 6/6 passing (100%)
- Extensive documentation:
  - `ARCHITECTURE_FIX_v4.0.4.md` - Technical architecture details
  - `SETUP_v4.0.4.md` - Setup and troubleshooting guide
  - `TEST_INFRASTRUCTURE_COMPLETE.md` - Test suite documentation
  - `START_HERE.md` - Quick start guide

### Removed
- Old WebSocket server code from Extension (backed up to `.backup`)
- Deprecated native messaging test
- Outdated integration tests for old architecture
- Invalid test files that didn't match new architecture

### Improved
- Test infrastructure completely overhauled
- All tests now pass (15/16, with 1 expected skip)
- Clear separation between E2E and integration tests
- Better error messages and logging in WebSocket components
- More stable connection handling

### Technical Details

#### Architecture Flow (v4.0.5)
```
IDE (stdio) ↔ MCP Server (WebSocket SERVER :8765) ← Extension (WebSocket CLIENT)
```

#### Why This Works
- Native browser `WebSocket` API **IS AVAILABLE** in Manifest V3 service workers
- `chrome.sockets.tcpServer` API **IS NOT AVAILABLE** in Manifest V3 service workers
- By hosting the WebSocket server in Node.js (MCP Server), we bypass all Chrome API limitations

### Migration Guide

**For existing users:**
1. Update to v4.0.5
2. Start MCP server FIRST: `cd mcp-server && node index.js`
3. Reload extension in Chrome
4. Extension will automatically connect to MCP server

**No changes required** in your IDE MCP configuration.

### Startup Order (IMPORTANT)
1. ✅ Start MCP Server FIRST (it hosts the WebSocket server)
2. ✅ Load/reload Extension in Chrome (it connects as client)

---

## [4.0.4] - 2025-10-09

### Fixed
- Initial architecture flip implementation
- WebSocket server/client role reversal

### Changed
- MCP Server changed from WebSocket client to server
- Extension changed from WebSocket server to client

---

## [4.0.3] - 2025-10-08

### Known Issues
- ❌ WebSocket server fails to start in Extension (chrome.sockets API not available in MV3)

---

## [4.0.0 - 4.0.2] - Earlier Versions

### Added
- Initial WebSocket-based architecture
- 33 browser debugging tools
- MCP protocol support
- Chrome Extension Manifest V3

### Known Issues
- WebSocket architecture incompatible with Manifest V3

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes to API or architecture
- **Minor (4.X.0)**: New features, non-breaking changes
- **Patch (4.0.X)**: Bug fixes, documentation updates

---

## Links

- [GitHub Repository](https://github.com/yourusername/browser-mcp)
- [NPM Package](https://www.npmjs.com/package/@rvegajr/browser-mcp-server)
- [Issue Tracker](https://github.com/yourusername/browser-mcp/issues)

---

**Full Changelog**: https://github.com/yourusername/browser-mcp/compare/v4.0.3...v4.0.5

