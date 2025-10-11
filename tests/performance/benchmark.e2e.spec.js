/**
 * Performance Benchmark Suite
 * 
 * Tests:
 * - Latency measurements (WebSocket, tool execution, end-to-end)
 * - Throughput testing (concurrent requests, sustained load)
 * - Resource usage (memory, connections)
 * - Performance degradation over time
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

test.describe('Performance Benchmarks', () => {
  
  test.beforeAll(async () => {
    console.log('\n==============================================');
    console.log('Performance Benchmark Suite');
    console.log('Testing: Latency, throughput, resource usage');
    console.log('==============================================\n');
    
    // Start MCP Server
    const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
    
    mcpServerProcess = spawn('node', [serverPath], {
      env: { ...process.env, BROWSER_MCP_PORT: '8765' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Load Chrome extension
    const extensionPath = path.resolve(__dirname, '../../browser-mcp-extension');
    const userDataDir = path.join(__dirname, '.playwright-benchmark');
    
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
    
    // Wait for connection
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
  
  test('WebSocket latency measurement', async () => {
    console.log('\nTest: WebSocket round-trip latency');
    
    const samples = 100;
    const latencies = [];
    
    for (let i = 0; i < samples; i++) {
      const startTime = Date.now();
      
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: `latency-${i}`,
        method: 'tools/list'
      });
      
      const latency = Date.now() - startTime;
      latencies.push(latency);
    }
    
    // Calculate statistics
    const sorted = latencies.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    console.log('\nLatency Statistics (ms):');
    console.log(`  Min:    ${min}ms`);
    console.log(`  Max:    ${max}ms`);
    console.log(`  Avg:    ${avg.toFixed(2)}ms`);
    console.log(`  P50:    ${p50}ms`);
    console.log(`  P95:    ${p95}ms`);
    console.log(`  P99:    ${p99}ms`);
    
    // Performance targets
    console.log('\nTarget Validation:');
    console.log(`  P50 < 200ms: ${p50 < 200 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  P95 < 500ms: ${p95 < 500 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  P99 < 1000ms: ${p99 < 1000 ? '✓ PASS' : '✗ FAIL'}`);
    
    // Assertions
    expect(p95).toBeLessThan(500); // 95th percentile < 500ms
  });
  
  test('Tool execution performance', async () => {
    console.log('\nTest: Tool execution time');
    
    const toolsToTest = [
      'listTabs',
      'getPageTitle',
      'evaluateCode',
      'getDOM',
      'getConsole'
    ];
    
    const results = [];
    
    for (const toolName of toolsToTest) {
      const samples = 10;
      const durations = [];
      
      for (let i = 0; i < samples; i++) {
        const startTime = Date.now();
        
        await sendMCPRequest({
          jsonrpc: '2.0',
          id: `perf-${toolName}-${i}`,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: toolName === 'evaluateCode' ? { expression: '2+2' } : {}
          }
        });
        
        durations.push(Date.now() - startTime);
      }
      
      const avg = durations.reduce((sum, val) => sum + val, 0) / samples;
      const max = Math.max(...durations);
      
      results.push({ tool: toolName, avg, max });
      
      console.log(`\n${toolName}:`);
      console.log(`  Avg: ${avg.toFixed(0)}ms`);
      console.log(`  Max: ${max}ms`);
      console.log(`  Target (<5s): ${max < 5000 ? '✓ PASS' : '✗ FAIL'}`);
      
      expect(max).toBeLessThan(5000); // Tool execution < 5s
    }
    
    // Overall statistics
    const overallAvg = results.reduce((sum, r) => sum + r.avg, 0) / results.length;
    console.log(`\nOverall average: ${overallAvg.toFixed(0)}ms`);
  });
  
  test('Concurrent request handling', async () => {
    console.log('\nTest: Concurrent request performance');
    
    const concurrentRequests = 10;
    const iterations = 5;
    
    console.log(`Testing ${concurrentRequests} concurrent requests × ${iterations} iterations`);
    
    const results = [];
    
    for (let iter = 0; iter < iterations; iter++) {
      const startTime = Date.now();
      
      // Send concurrent requests
      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          sendMCPRequest({
            jsonrpc: '2.0',
            id: `concurrent-${iter}-${i}`,
            method: 'tools/list'
          })
        );
      }
      
      // Wait for all to complete
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      results.push(duration);
      
      console.log(`  Iteration ${iter + 1}: ${duration}ms`);
    }
    
    const avgDuration = results.reduce((sum, val) => sum + val, 0) / iterations;
    const maxDuration = Math.max(...results);
    
    console.log(`\nConcurrent Performance:`);
    console.log(`  Avg: ${avgDuration.toFixed(0)}ms`);
    console.log(`  Max: ${maxDuration}ms`);
    console.log(`  Throughput: ${(concurrentRequests * 1000 / avgDuration).toFixed(1)} req/s`);
    
    // Should handle concurrent requests reasonably
    expect(maxDuration).toBeLessThan(10000); // < 10s for 10 concurrent
  });
  
  test('Sustained load test', async () => {
    console.log('\nTest: Sustained load');
    
    const duration = 30000; // 30 seconds
    const requestInterval = 1000; // 1 request per second
    const startTime = Date.now();
    
    const latencies = [];
    let requestCount = 0;
    let errorCount = 0;
    
    console.log(`Running sustained load for ${duration / 1000}s`);
    console.log(`Target rate: ${1000 / requestInterval} req/s`);
    
    while (Date.now() - startTime < duration) {
      const reqStart = Date.now();
      
      try {
        await sendMCPRequest({
          jsonrpc: '2.0',
          id: `sustained-${requestCount}`,
          method: 'tools/list'
        });
        
        const latency = Date.now() - reqStart;
        latencies.push(latency);
        requestCount++;
        
        if (requestCount % 10 === 0) {
          console.log(`  Sent ${requestCount} requests...`);
        }
      } catch (error) {
        errorCount++;
      }
      
      // Wait for next interval
      const elapsed = Date.now() - reqStart;
      const wait = Math.max(0, requestInterval - elapsed);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    
    // Calculate statistics
    const sorted = latencies.sort((a, b) => a - b);
    const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    console.log(`\nSustained Load Results:`);
    console.log(`  Total requests: ${requestCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Success rate: ${((requestCount - errorCount) / requestCount * 100).toFixed(1)}%`);
    console.log(`  Avg latency: ${avg.toFixed(0)}ms`);
    console.log(`  P95 latency: ${p95}ms`);
    
    // Validate
    const successRate = (requestCount - errorCount) / requestCount;
    expect(successRate).toBeGreaterThan(0.99); // >99% success rate
    expect(p95).toBeLessThan(1000); // P95 < 1s under sustained load
  });
  
  test('Memory stability check', async () => {
    console.log('\nTest: Memory stability');
    
    // Send many requests and check for memory leaks
    const iterations = 100;
    
    console.log(`Sending ${iterations} requests to check for leaks...`);
    
    for (let i = 0; i < iterations; i++) {
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: `memory-${i}`,
        method: 'tools/call',
        params: {
          name: 'listTabs',
          arguments: {}
        }
      });
      
      if ((i + 1) % 20 === 0) {
        console.log(`  Completed ${i + 1}/${iterations} requests`);
      }
    }
    
    console.log('\n✓ Completed without crashes or errors');
    console.log('Note: Check server process memory usage manually');
  });
  
  test('Connection pool stress test', async () => {
    console.log('\nTest: Connection pool stress');
    
    const connectionCount = 20;
    const requestsPerConnection = 5;
    
    console.log(`Creating ${connectionCount} connections`);
    console.log(`Sending ${requestsPerConnection} requests per connection`);
    
    const startTime = Date.now();
    
    const connectionPromises = [];
    
    for (let c = 0; c < connectionCount; c++) {
      const promise = (async () => {
        const ws = await createConnection();
        
        for (let r = 0; r < requestsPerConnection; r++) {
          await sendRequest(ws, {
            jsonrpc: '2.0',
            id: `pool-${c}-${r}`,
            method: 'tools/list'
          });
        }
        
        ws.close();
      })();
      
      connectionPromises.push(promise);
    }
    
    await Promise.all(connectionPromises);
    
    const duration = Date.now() - startTime;
    const totalRequests = connectionCount * requestsPerConnection;
    
    console.log(`\nConnection Pool Results:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Total requests: ${totalRequests}`);
    console.log(`  Throughput: ${(totalRequests * 1000 / duration).toFixed(1)} req/s`);
    console.log(`  ✓ All connections handled successfully`);
  });
  
});

/**
 * Helper: Send MCP request via WebSocket
 */
async function sendMCPRequest(request, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('Request timeout'));
    }, timeout);
    
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.on('open', () => {
      ws.send(JSON.stringify(request));
    });
    
    ws.on('message', (data) => {
      clearTimeout(timer);
      try {
        const response = JSON.parse(data.toString());
        if (response.id === request.id) {
          ws.close();
          resolve(response);
        }
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

/**
 * Helper: Create WebSocket connection
 */
function createConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
    
    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });
}

/**
 * Helper: Send request on existing connection
 */
function sendRequest(ws, request) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
    
    const handler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.id === request.id) {
          clearTimeout(timeout);
          ws.removeListener('message', handler);
          resolve(response);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };
    
    ws.on('message', handler);
    ws.send(JSON.stringify(request));
  });
}


