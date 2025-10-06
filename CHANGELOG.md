# Changelog

All notable changes to Browser MCP will be documented in this file.

## [1.0.2] - 2025-10-06

### Added
- ✨ **Chrome Extension Setup Wizard** - Beautiful 4-step wizard for configuring Browser MCP
  - Support for Claude Desktop, Cursor, and Windsurf IDEs
  - Automatic OS detection (macOS, Linux, Windows)
  - One-click configuration copy to clipboard
  - Step-by-step user guidance

### Testing
- 🧪 **38 new unit tests** for popup wizard logic (200 tests total, up from 162)
- ✅ Test-Driven Development (TDD) for all business logic
- 📁 Separated pure business logic from DOM manipulation for testability
- 🎯 100% coverage of wizard configuration generation

### Documentation
- 📖 Added `extension-chromium/popup/README.md` - Popup testing guide
- 📖 Updated `TESTING.md` - Complete testing guide with 200 tests
- 📖 Comprehensive test documentation for all modules

### Files Added
- `extension-chromium/popup/popup-logic.ts` - Pure business logic (testable)
- `extension-chromium/popup/popup-logic.unit.test.ts` - 38 comprehensive unit tests
- `extension-chromium/popup/README.md` - Testing documentation

### Changed
- 🎨 Complete redesign of Chrome extension popup from debug UI to setup wizard
- 🔧 Improved event handling in popup (removed inline handlers, added event listeners)
- 📦 Updated all package versions to 1.0.2
- 🏗️ Better separation of concerns in extension popup architecture

### Technical Improvements
- Extracted IDE configuration logic into testable functions
- Added OS-specific configuration path resolution
- Improved JSON configuration generation
- Better error handling for clipboard operations
- Enhanced test infrastructure with happy-dom for browser testing

## [1.0.1] - 2025-10-05

### Added
- Initial release with core functionality
- 162 tests passing
- Basic Chrome extension popup

### Features
- MCP Server with stdio transport
- Tab management and port allocation
- Virtual filesystem for browser resources
- Framework detection (React, Vue, Angular, etc.)
- Chrome DevTools Protocol integration
- Session management for IDE bindings

## [1.0.0] - 2025-10-04

### Added
- Initial project setup
- Core architecture with Clean Architecture principles
- Interface Segregation Principle (ISP) enforcement
- Basic infrastructure implementations

---

**Full Changelog**: https://github.com/yourusername/browser-mcp/compare/v1.0.1...v1.0.2
