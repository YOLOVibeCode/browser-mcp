# Browser MCP Setup Wizard

A step-by-step wizard for configuring Browser MCP with AI assistants (Claude Desktop, Cursor, Windsurf).

## Files

- **popup.html** - Setup wizard UI with 4-step flow
- **popup.ts** - DOM manipulation and event handling
- **popup-logic.ts** - Pure business logic (testable)
- **popup-logic.unit.test.ts** - 38 unit tests following TDD principles

## Testing

The setup wizard logic is fully tested with TDD:

```bash
# Run all popup tests
npm test -- extension-chromium/popup

# Run only logic tests
npm test -- extension-chromium/popup/popup-logic.unit.test.ts

# Watch mode
npm test -- extension-chromium/popup --watch
```

### Test Coverage

- ✅ IDE configuration generation (Claude Desktop, Cursor, Windsurf)
- ✅ OS detection (macOS, Linux, Windows)
- ✅ Config path resolution per IDE and OS
- ✅ JSON configuration generation
- ✅ Edge cases and error handling

All 38 tests passing with 100% coverage of business logic.

## Architecture

The wizard follows **Separation of Concerns**:

1. **popup-logic.ts** - Pure functions, no DOM dependencies
   - Testable in isolation
   - IDE configurations
   - OS detection
   - Config generation

2. **popup.ts** - DOM manipulation only
   - Event listeners
   - Step navigation
   - UI updates
   - Calls logic functions

This separation enables TDD and makes the code maintainable.

## Usage

1. Install Chrome extension
2. Click extension icon
3. Follow 4-step wizard:
   - Welcome
   - Choose IDE
   - Copy configuration
   - Complete setup
