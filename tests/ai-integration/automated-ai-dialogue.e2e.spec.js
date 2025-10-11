/**
 * Automated AI Dialogue Test
 * 
 * Simulates a real AI assistant having a conversation via MCP server
 * Tests the complete flow: AI question → MCP request → Browser action → Response
 * 
 * This test demonstrates how an AI would interact with the browser:
 * 1. AI asks about browser state
 * 2. Test simulates MCP tool calls
 * 3. Browser executes actions
 * 4. AI receives structured responses
 * 5. AI can follow up with more questions
 */

import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mcpServerProcess;
let context;
let testPage;

/**
 * Simulated AI Dialogue Scenarios
 * Each scenario represents a realistic AI assistant conversation
 */
const AI_DIALOGUE_SCENARIOS = [
  {
    name: "Discover Browser State",
    conversation: [
      {
        aiQuestion: "What tabs are currently open in the browser?",
        mcpTool: "listTabs",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          expect(response.result.tabs).toBeDefined();
          expect(Array.isArray(response.result.tabs)).toBe(true);
          return response.result.tabs;
        },
        aiResponse: (result) => `I found ${result.totalCount} open tab(s). Let me examine the first one.`
      },
      {
        aiQuestion: "What is the title of the first tab?",
        mcpTool: "getPageTitle",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          expect(response.result.title).toBeDefined();
          return response.result.title;
        },
        aiResponse: (result) => `The page title is "${result}". Let me check the DOM structure.`
      },
      {
        aiQuestion: "Show me the DOM structure of this page",
        mcpTool: "getDOM",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          expect(response.result.dom).toBeDefined();
          return response.result.dom;
        },
        aiResponse: (result) => `The page has a DOM structure. Let me execute some JavaScript.`
      }
    ]
  },
  
  {
    name: "Execute JavaScript and Check Results",
    conversation: [
      {
        aiQuestion: "Calculate 2 + 2 in the browser console",
        mcpTool: "evaluateCode",
        params: { expression: "2 + 2" },
        validate: (response) => {
          expect(response.result).toBeDefined();
          expect(response.result.result).toBeDefined();
          return response.result.result;
        },
        aiResponse: (result) => `The result is ${result}. Let me check the console logs.`
      },
      {
        aiQuestion: "What console messages are there?",
        mcpTool: "getConsole",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          // Console might be empty, that's okay
          return response.result;
        },
        aiResponse: (result) => `Console has ${result.totalCount || 0} message(s).`
      }
    ]
  },
  
  {
    name: "Query and Inspect DOM Elements",
    conversation: [
      {
        aiQuestion: "Find the body element",
        mcpTool: "querySelector",
        params: { selector: "body" },
        validate: (response) => {
          expect(response.result).toBeDefined();
          return response.result;
        },
        aiResponse: (result) => `Found the body element. Let me check its CSS styles.`
      },
      {
        aiQuestion: "What CSS styles does the body have?",
        mcpTool: "getCSSStyles",
        params: { selector: "body" },
        validate: (response) => {
          expect(response.result).toBeDefined();
          expect(response.result.styles).toBeDefined();
          return response.result.styles;
        },
        aiResponse: (result) => `The body has CSS styles applied. Let me search for text.`
      },
      {
        aiQuestion: "Find all elements containing 'Example'",
        mcpTool: "findByText",
        params: { text: "Example" },
        validate: (response) => {
          expect(response.result).toBeDefined();
          return response.result;
        },
        aiResponse: (result) => `Found elements with "Example" text.`
      }
    ]
  },
  
  {
    name: "Check Storage and Network",
    conversation: [
      {
        aiQuestion: "What storage data exists in this page?",
        mcpTool: "getAllStorage",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          return response.result;
        },
        aiResponse: (result) => `Examined storage data. Let me check network activity.`
      },
      {
        aiQuestion: "What network requests have been made?",
        mcpTool: "getNetwork",
        params: {},
        validate: (response) => {
          expect(response.result).toBeDefined();
          return response.result;
        },
        aiResponse: (result) => `Network activity recorded.`
      }
    ]
  }
];

test.describe('Automated AI Dialogue Integration', () => {
  
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('Automated AI Dialogue Test Suite');
    console.log('Simulating real AI assistant conversations');
    console.log('='.repeat(60) + '\n');
    
    // Start MCP Server
    console.log('Starting MCP server...');
    const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
    
    mcpServerProcess = spawn('node', [serverPath], {
      env: { ...process.env, BROWSER_MCP_PORT: '8765' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    mcpServerProcess.stderr.on('data', (data) => {
      const log = data.toString();
      if (log.includes('error') || log.includes('Error')) {
        console.log('[MCP Server ERROR]', log);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Load Chrome extension
    console.log('Loading Chrome extension...');
    const extensionPath = path.resolve(__dirname, '../../browser-mcp-extension');
    const userDataDir = path.join(__dirname, '.playwright-ai-dialogue');
    
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000,
    });
    
    await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => {});
    
    // Open test page
    testPage = await context.newPage();
    await testPage.goto('https://example.com');
    console.log('✓ Test page loaded: example.com');
    
    // Add some content for testing
    await testPage.evaluate(() => {
      document.body.innerHTML += '<div id="test-div" class="test-class">Test Content</div>';
      console.log('Test page initialized');
    });
    
    // Wait for extension connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✓ Setup complete\n');
    
  }, 90000);
  
  test.afterAll(async () => {
    if (testPage) await testPage.close();
    if (context) await context.close();
    if (mcpServerProcess) {
      mcpServerProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });
  
  // Create a test for each AI dialogue scenario
  AI_DIALOGUE_SCENARIOS.forEach((scenario) => {
    
    test(`AI Dialogue: ${scenario.name}`, async () => {
      console.log('\n' + '─'.repeat(60));
      console.log(`🤖 AI Scenario: ${scenario.name}`);
      console.log('─'.repeat(60));
      
      const conversationLog = [];
      
      // Execute conversation turns
      for (let i = 0; i < scenario.conversation.length; i++) {
        const turn = scenario.conversation[i];
        const turnNumber = i + 1;
        
        console.log(`\n[Turn ${turnNumber}/${scenario.conversation.length}]`);
        console.log(`🧑 AI thinks: "${turn.aiQuestion}"`);
        console.log(`🔧 AI calls tool: ${turn.mcpTool}`);
        console.log(`📋 Parameters:`, JSON.stringify(turn.params));
        
        // Execute MCP tool call
        const startTime = Date.now();
        const response = await callMCPTool(turn.mcpTool, turn.params);
        const duration = Date.now() - startTime;
        
        console.log(`⏱️  Execution time: ${duration}ms`);
        
        // Validate response
        let result;
        try {
          result = turn.validate(response);
          console.log(`✓ Response validated`);
        } catch (error) {
          console.log(`✗ Validation failed:`, error.message);
          throw error;
        }
        
        // AI interprets result
        const aiInterpretation = turn.aiResponse(result);
        console.log(`💬 AI responds: "${aiInterpretation}"`);
        
        // Log conversation turn
        conversationLog.push({
          turn: turnNumber,
          question: turn.aiQuestion,
          tool: turn.mcpTool,
          params: turn.params,
          duration,
          response: response.result || response.error,
          aiInterpretation
        });
        
        // Small delay between turns (simulate thinking)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('\n' + '─'.repeat(60));
      console.log('✅ Conversation Complete');
      console.log(`   Turns: ${conversationLog.length}`);
      console.log(`   Avg time: ${(conversationLog.reduce((sum, turn) => sum + turn.duration, 0) / conversationLog.length).toFixed(0)}ms per turn`);
      console.log('─'.repeat(60));
      
      // Validate overall conversation
      expect(conversationLog.length).toBe(scenario.conversation.length);
      expect(conversationLog.every(turn => turn.duration < 5000)).toBe(true);
    });
    
  });
  
  test('Full AI Workflow: Multi-Tool Discovery', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 Advanced AI Workflow: Complete Browser Discovery');
    console.log('='.repeat(60));
    
    /**
     * Simulates an AI doing comprehensive browser analysis
     */
    
    // Phase 1: Discovery
    console.log('\n📍 Phase 1: Discovery');
    const tabs = await callMCPTool('listTabs', {});
    console.log(`   Found ${tabs.result.totalCount} tab(s)`);
    expect(tabs.result.tabs.length).toBeGreaterThan(0);
    
    // Phase 2: Page Analysis
    console.log('\n📍 Phase 2: Page Analysis');
    const title = await callMCPTool('getPageTitle', {});
    console.log(`   Page title: "${title.result.title}"`);
    expect(title.result.title).toBeDefined();
    
    // Phase 3: DOM Inspection
    console.log('\n📍 Phase 3: DOM Inspection');
    const body = await callMCPTool('querySelector', { selector: 'body' });
    console.log(`   Body element found`);
    expect(body.result).toBeDefined();
    
    // Phase 4: JavaScript Execution
    console.log('\n📍 Phase 4: JavaScript Execution');
    const jsResult = await callMCPTool('evaluateCode', {
      expression: 'document.querySelector("#test-div") ? "Found test div" : "Not found"'
    });
    console.log(`   JS result: ${jsResult.result.result}`);
    expect(jsResult.result.result).toBe('Found test div');
    
    // Phase 5: Style Analysis
    console.log('\n📍 Phase 5: Style Analysis');
    const styles = await callMCPTool('getCSSStyles', { selector: 'body' });
    console.log(`   CSS styles retrieved`);
    expect(styles.result.styles).toBeDefined();
    
    // Phase 6: Storage Check
    console.log('\n📍 Phase 6: Storage Check');
    const storage = await callMCPTool('getAllStorage', {});
    console.log(`   Storage data examined`);
    expect(storage.result).toBeDefined();
    
    console.log('\n✅ Complete workflow executed successfully');
    console.log('   AI assistant demonstrated full browser control');
  });
  
  test('Measure AI Response Time Performance', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ Performance Test: AI Response Times');
    console.log('='.repeat(60));
    
    const commonAIQueries = [
      { tool: 'listTabs', label: 'List browser tabs' },
      { tool: 'getPageTitle', label: 'Get page title' },
      { tool: 'evaluateCode', params: { expression: '1+1' }, label: 'Execute simple JS' },
      { tool: 'querySelector', params: { selector: 'body' }, label: 'Query DOM element' },
      { tool: 'getConsole', label: 'Get console logs' }
    ];
    
    const results = [];
    
    for (const query of commonAIQueries) {
      const startTime = Date.now();
      await callMCPTool(query.tool, query.params || {});
      const duration = Date.now() - startTime;
      
      results.push({ label: query.label, duration });
      console.log(`   ${query.label}: ${duration}ms`);
    }
    
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    
    console.log('\n📊 Performance Summary:');
    console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Maximum: ${maxDuration}ms`);
    console.log(`   Target: < 5000ms`);
    
    // All queries should complete quickly
    expect(maxDuration).toBeLessThan(5000);
    expect(avgDuration).toBeLessThan(2000);
    
    console.log('\n✅ AI response times meet performance targets');
  });
  
});

/**
 * Helper: Call MCP tool via WebSocket
 */
async function callMCPTool(toolName, params, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Tool call timeout: ${toolName}`));
    }, timeout);
    
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.on('open', () => {
      const request = {
        jsonrpc: '2.0',
        id: `ai-${toolName}-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };
      
      ws.send(JSON.stringify(request));
    });
    
    ws.on('message', (data) => {
      clearTimeout(timer);
      
      try {
        const response = JSON.parse(data.toString());
        ws.close();
        resolve(response);
      } catch (error) {
        ws.close();
        reject(error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}


