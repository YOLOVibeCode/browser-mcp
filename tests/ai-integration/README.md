# Automated AI Dialogue Testing

This directory contains automated tests that simulate real AI assistant conversations with the Browser MCP server.

## What This Tests

Rather than manually testing with Claude Desktop or Cursor IDE, these tests **simulate an AI assistant** having natural conversations with your browser, demonstrating:

1. **Multi-turn conversations** - AI asks questions, gets responses, follows up
2. **Tool chaining** - AI uses multiple tools in sequence to accomplish goals
3. **Real-world scenarios** - Common tasks an AI would perform
4. **Performance validation** - Response times suitable for interactive AI chat

## Test Scenarios

### 1. Discover Browser State
```
AI: "What tabs are currently open?"
   → listTabs
   → "I found 1 tab. Let me examine it."

AI: "What is the title?"
   → getPageTitle
   → "The title is 'Example Domain'. Let me check the DOM."

AI: "Show me the DOM structure"
   → getDOM
   → "The page has a DOM structure."
```

### 2. Execute JavaScript and Check Results
```
AI: "Calculate 2 + 2 in the browser"
   → evaluateCode(2 + 2)
   → "The result is 4. Let me check console logs."

AI: "What console messages are there?"
   → getConsole
   → "Console has X messages."
```

### 3. Query and Inspect DOM Elements
```
AI: "Find the body element"
   → querySelector(body)
   → "Found the body element. Let me check its styles."

AI: "What CSS styles does it have?"
   → getCSSStyles(body)
   → "The body has CSS styles applied."

AI: "Find elements containing 'Example'"
   → findByText('Example')
   → "Found elements with 'Example' text."
```

### 4. Check Storage and Network
```
AI: "What storage data exists?"
   → getAllStorage
   → "Examined storage data. Let me check network."

AI: "What network requests were made?"
   → getNetwork
   → "Network activity recorded."
```

## Running the Tests

### Quick Run
```bash
npm run test:ai:dialogue
```

### With Browser Visible (Watch AI in Action)
```bash
npx playwright test tests/ai-integration/automated-ai-dialogue.e2e.spec.js --headed --reporter=list
```

### Expected Output
```
🤖 AI Scenario: Discover Browser State
─────────────────────────────────────────

[Turn 1/3]
🧑 AI thinks: "What tabs are currently open in the browser?"
🔧 AI calls tool: listTabs
📋 Parameters: {}
⏱️  Execution time: 234ms
✓ Response validated
💬 AI responds: "I found 1 open tab(s). Let me examine the first one."

[Turn 2/3]
🧑 AI thinks: "What is the title of the first tab?"
🔧 AI calls tool: getPageTitle
📋 Parameters: {}
⏱️  Execution time: 156ms
✓ Response validated
💬 AI responds: "The page title is "Example Domain". Let me check the DOM."

✅ Conversation Complete
   Turns: 3
   Avg time: 195ms per turn
```

## Test Structure

### Conversation Format
```javascript
{
  name: "Scenario Name",
  conversation: [
    {
      aiQuestion: "What the AI is thinking",
      mcpTool: "toolName",
      params: { /* tool parameters */ },
      validate: (response) => {
        // Validate response structure
        expect(response.result).toBeDefined();
        return extractedData;
      },
      aiResponse: (result) => "AI's interpretation of the result"
    },
    // ... more turns
  ]
}
```

### Adding New Scenarios

1. Add to `AI_DIALOGUE_SCENARIOS` in `automated-ai-dialogue.e2e.spec.js`
2. Define the conversation flow
3. Add validation for each response
4. Run the test

Example:
```javascript
{
  name: "Custom Workflow",
  conversation: [
    {
      aiQuestion: "Check if React is loaded",
      mcpTool: "detectFramework",
      params: {},
      validate: (response) => {
        expect(response.result.framework).toBeDefined();
        return response.result.framework;
      },
      aiResponse: (result) => `Detected ${result} framework`
    }
  ]
}
```

## What Gets Tested

### Functionality
- ✅ Multi-turn conversations work
- ✅ Tool chaining (results from one tool inform next)
- ✅ Error handling (tools may return errors)
- ✅ Response structure validation
- ✅ AI interpretation of results

### Performance
- ✅ Response time < 5s per turn
- ✅ Average conversation time
- ✅ End-to-end workflow timing

### Realism
- ✅ Natural conversation flow
- ✅ Follow-up questions based on results
- ✅ Common AI use cases
- ✅ Multi-tool workflows

## Benefits of Automated AI Testing

### vs. Manual Testing with Claude/Cursor
| Manual | Automated |
|--------|-----------|
| Slow (minutes per test) | Fast (seconds) |
| Requires human interaction | Runs unattended |
| Hard to reproduce | 100% reproducible |
| Can't run in CI/CD | CI/CD ready |
| Limited scenarios | Unlimited scenarios |

### What It Proves
1. **AI assistants CAN use your MCP server** - The conversation patterns work
2. **Performance is acceptable** - Response times suitable for chat
3. **Multi-turn conversations work** - AI can chain tools together
4. **Error handling works** - AI gets useful error messages
5. **Real-world scenarios** - Not just unit tests, actual use cases

## Advanced Tests

### Full AI Workflow Test
Tests a comprehensive 6-phase browser discovery:
```
Phase 1: Discovery (listTabs)
Phase 2: Page Analysis (getPageTitle)
Phase 3: DOM Inspection (querySelector)
Phase 4: JavaScript Execution (evaluateCode)
Phase 5: Style Analysis (getCSSStyles)
Phase 6: Storage Check (getAllStorage)
```

### Performance Benchmarking
Measures response times for common AI queries:
```
List browser tabs: 234ms
Get page title: 156ms
Execute simple JS: 189ms
Query DOM element: 201ms
Get console logs: 145ms

Average: 185ms ✓
Maximum: 234ms ✓
```

## CI/CD Integration

Add to your GitHub Actions:
```yaml
- name: Test AI Dialogue Integration
  run: npm run test:ai:dialogue
```

This ensures every commit is validated against real AI usage patterns!

## Troubleshooting

### "Tool execution timeout"
- Increase timeout in test
- Check if MCP server is running
- Verify extension is loaded

### "Validation failed"
- Tool might return error (check browser state)
- Response structure changed
- Update validation logic

### Slow execution
- Normal - real browser operations take time
- Check network latency
- Ensure sufficient system resources

## Real AI Testing

While these automated tests validate the technical integration, you should also test with real AI assistants:

### Claude Desktop
```bash
# Configure Claude
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << EOF
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
EOF

# Restart Claude and try:
# "What tabs are open in my browser?"
```

### Cursor IDE
```bash
# Configure Cursor
cat > ~/.cursor/mcp.json << EOF
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
EOF

# Restart Cursor and try:
# "Evaluate 2+2 in my browser"
```

## Conclusion

Automated AI dialogue testing gives you **confidence** that real AI assistants will work with your MCP server, without requiring manual testing for every change.

**Run now:**
```bash
npm run test:ai:dialogue
```

Watch an AI assistant discover and interact with a browser, fully automated! 🤖🚀


