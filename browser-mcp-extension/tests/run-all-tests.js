/**
 * Run All Tests - Comprehensive test runner
 */

import { runTests as runTabManagerTests } from './tab-manager.test.js';
import { runTests as runChromeCDPTests } from './chrome-cdp.test.js';
import { runTests as runMCPServerTests } from './mcp-server.test.js';
import { runTests as runNativeMessagingTests } from './native-messaging.test.js';
import { runTests as runMessageFilterTests } from './message-filter.test.js';
import { runTests as runDeltaCompressionTests } from './delta-compression.test.js';
import { runTests as runE2ETests } from './e2e.test.js';

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Browser MCP - Complete Test Suite');
  console.log('='.repeat(60));
  console.log('');

  const suites = [
    { name: 'TabManager', fn: runTabManagerTests },
    { name: 'ChromeCDP', fn: runChromeCDPTests },
    { name: 'MCPServer', fn: runMCPServerTests },
    { name: 'Native Messaging', fn: runNativeMessagingTests },
    { name: 'Message Filter', fn: runMessageFilterTests },
    { name: 'Delta Compression', fn: runDeltaCompressionTests },
    { name: 'E2E Integration', fn: runE2ETests }
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  for (const suite of suites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${suite.name}`);
    console.log('='.repeat(60));
    
    try {
      const success = await suite.fn();
      results.push({ name: suite.name, success });
    } catch (error) {
      console.error(`Fatal error in ${suite.name}:`, error);
      results.push({ name: suite.name, success: false });
    }
  }

  // Summary
  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('TEST SUITE SUMMARY');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
  }
  
  const allPassed = results.every(r => r.success);
  
  console.log('\n');
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TEST SUITES PASSED!');
  } else {
    console.log('⚠️  SOME TEST SUITES FAILED');
  }
  console.log('='.repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();

