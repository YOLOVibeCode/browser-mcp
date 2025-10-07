/**
 * AI Simulator - Test MCP tools with real or mock AI
 */

let selectedProvider = 'openai';
let apiKey = null;
let useMock = true;

// Recipe prompts
const recipes = {
  'list-tabs': "Can you list all the browser tabs you have access to?",
  'check-tools': "What browser inspection tools do you have available?",
  'pin-tab': "Pin tab 1 to my session so I can focus on it",
  'get-resources': "Show me the available resources for my browser tabs"
};

// Mock MCP responses
const mockMCPResponses = {
  'listActiveTabs': {
    success: true,
    result: [
      {
        tabId: 1,
        url: "http://localhost:3000",
        title: "Test Page",
        port: 3100,
        framework: null,
        isActive: true,
        virtualFilesystemURI: "browser://tab-localhost-3000/",
        activatedAt: Date.now()
      }
    ]
  },
  'tools/list': {
    tools: [
      { name: 'listActiveTabs', description: 'List all active browser tabs' },
      { name: 'getTabInfo', description: 'Get information about a specific tab' },
      { name: 'pinTab', description: 'Pin a specific tab to this IDE session' },
      { name: 'unpinTab', description: 'Unpin the tab from this IDE session' },
      { name: 'getPinnedTab', description: 'Get which tab is pinned to this session' },
      { name: 'listSessionBindings', description: 'List all active session-to-tab bindings' }
    ]
  },
  'pinTab': {
    success: true,
    data: {
      message: "Tab 1 pinned to session vscode-123",
      tab: {
        tabId: 1,
        url: "http://localhost:3000",
        port: 3100
      }
    }
  },
  'resources/list': {
    resources: [
      { uri: 'browser://tab-localhost-3000/dom/html', mimeType: 'text/html' },
      { uri: 'browser://tab-localhost-3000/console/logs', mimeType: 'application/json' },
      { uri: 'browser://tab-localhost-3000/network/requests', mimeType: 'application/json' },
      { uri: 'browser://tab-localhost-3000/metadata/frameworks', mimeType: 'application/json' }
    ]
  }
};

// Mock AI responses based on prompts
const mockAIResponses = {
  'list-tabs': {
    thought: "I'll call the listActiveTabs tool to see what browser tabs are connected.",
    toolCall: 'listActiveTabs',
    response: "I can see 1 active browser tab:\n\n• **Tab 1**: http://localhost:3000 (Port 3100)\n  - Status: Active\n  - Virtual filesystem: browser://tab-localhost-3000/\n\nThis tab has a full virtual filesystem available with DOM, console logs, network requests, and framework detection."
  },
  'check-tools': {
    thought: "Let me list all available MCP tools for browser inspection.",
    toolCall: 'tools/list',
    response: "I have access to 6 browser inspection tools:\n\n1. **listActiveTabs** - List all active browser tabs\n2. **getTabInfo** - Get detailed information about a specific tab\n3. **pinTab** - Pin a tab to your IDE session for focused inspection\n4. **unpinTab** - Unpin a previously pinned tab\n5. **getPinnedTab** - Check which tab is currently pinned\n6. **listSessionBindings** - View all session-to-tab bindings\n\nThese tools let me inspect your browser tabs, manage session focus, and access browser state like DOM, console logs, and network activity!"
  },
  'pin-tab': {
    thought: "I'll use the pinTab tool to pin tab 1 to your current session.",
    toolCall: 'pinTab',
    response: "✓ Success! I've pinned Tab 1 (http://localhost:3000) to your session.\n\nNow whenever you ask me about \"the browser\" or \"the tab\", I'll automatically focus on this specific tab. This makes it easier to have conversations about a particular page without repeating the tab ID."
  },
  'get-resources': {
    thought: "Let me check what resources are available from the virtual filesystem.",
    toolCall: 'resources/list',
    response: "For your active browser tabs, I can access these resources:\n\n**browser://tab-localhost-3000/**\n• `dom/html` - Full HTML DOM of the page\n• `console/logs` - Console log output\n• `network/requests` - Network requests and responses\n• `metadata/frameworks` - Detected JavaScript frameworks\n\nI can read any of these resources to help you debug, analyze, or understand what's happening in your browser!"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('AI Simulator loaded');

  // Load saved config
  loadSavedConfig();

  // API Provider Selection
  document.querySelectorAll('.api-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.api-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedProvider = option.dataset.provider;
    });
  });

  // Save API Key
  document.getElementById('saveApiKeyBtn').addEventListener('click', async () => {
    apiKey = document.getElementById('apiKeyInput').value.trim();

    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    // Save to local storage
    await chrome.storage.local.set({
      aiProvider: selectedProvider,
      apiKey: apiKey
    });

    useMock = false;
    showSimulator();
  });

  // Use Mock Mode
  document.getElementById('useMockBtn').addEventListener('click', () => {
    useMock = true;
    showSimulator();
  });

  // Recipe Cards
  document.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', () => {
      const recipe = card.dataset.recipe;
      const prompt = recipes[recipe];
      document.getElementById('chatInput').value = prompt;
      sendMessage();
    });
  });

  // Send Message
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Clear Chat
  document.getElementById('clearChatBtn').addEventListener('click', () => {
    const container = document.getElementById('chatContainer');
    container.innerHTML = `
      <div class="chat-message assistant">
        <div class="chat-message-content">
          👋 Chat cleared! Ask me anything about your browser tabs.
        </div>
      </div>
    `;
  });

  // Change API
  document.getElementById('changeApiBtn').addEventListener('click', () => {
    document.getElementById('configSection').style.display = 'block';
    document.getElementById('simulatorSection').style.display = 'none';
  });
});

async function loadSavedConfig() {
  const stored = await chrome.storage.local.get(['aiProvider', 'apiKey']);
  if (stored.apiKey) {
    selectedProvider = stored.aiProvider || 'openai';
    apiKey = stored.apiKey;
    useMock = false;

    // Pre-fill the form
    document.getElementById('apiKeyInput').value = apiKey;
    document.querySelectorAll('.api-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.provider === selectedProvider);
    });
  }
}

function showSimulator() {
  document.getElementById('configSection').style.display = 'none';
  document.getElementById('simulatorSection').style.display = 'block';

  // Update status
  const statusIcon = document.getElementById('apiStatusIcon');
  const statusText = document.getElementById('apiStatusText');

  if (useMock) {
    statusIcon.textContent = '🎭';
    statusText.textContent = 'Using Mock Mode';
    document.getElementById('apiStatus').className = 'success-box';
    document.getElementById('apiStatus').innerHTML = statusIcon.outerHTML + ' <strong>' + statusText.textContent + '</strong> - No API calls will be made';
  } else {
    statusIcon.textContent = '✓';
    statusText.textContent = `Connected to ${selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'}`;
    document.getElementById('apiStatus').className = 'success-box';
    document.getElementById('apiStatus').innerHTML = statusIcon.outerHTML + ' <strong>' + statusText.textContent + '</strong> - Using real AI API';
  }
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  // Clear input
  input.value = '';

  // Add user message
  addMessage('user', message);

  // Disable send button
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="spinner"></span>Thinking...';

  try {
    if (useMock) {
      await handleMockResponse(message);
    } else {
      await handleRealAPIResponse(message);
    }
  } catch (err) {
    addMessage('assistant', `❌ Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
  }
}

async function handleMockResponse(message) {
  // Simulate thinking delay
  await sleep(1000);

  // Find matching recipe
  let recipeMatch = null;
  for (const [key, prompt] of Object.entries(recipes)) {
    if (message.toLowerCase().includes(prompt.toLowerCase().substring(0, 20))) {
      recipeMatch = key;
      break;
    }
  }

  // Fallback detection
  if (!recipeMatch) {
    if (message.toLowerCase().includes('tab')) recipeMatch = 'list-tabs';
    else if (message.toLowerCase().includes('tool')) recipeMatch = 'check-tools';
    else if (message.toLowerCase().includes('pin')) recipeMatch = 'pin-tab';
    else if (message.toLowerCase().includes('resource')) recipeMatch = 'get-resources';
  }

  if (recipeMatch && mockAIResponses[recipeMatch]) {
    const mockResponse = mockAIResponses[recipeMatch];

    // Show tool call
    await sleep(500);
    addMessage('tool', `🔧 Calling MCP Tool: ${mockResponse.toolCall}\n\n${JSON.stringify(mockMCPResponses[mockResponse.toolCall], null, 2)}`);

    // Show AI response
    await sleep(1000);
    addMessage('assistant', mockResponse.response);
  } else {
    // Generic response
    addMessage('assistant', "I'm a mock AI assistant. Try asking me about:\n• Listing browser tabs\n• Checking available tools\n• Pinning tabs\n• Viewing browser resources\n\nOr click one of the recipe cards above!");
  }
}

async function handleRealAPIResponse(message) {
  // This would call the actual OpenAI or Anthropic API
  // with MCP tool definitions

  try {
    let response;

    if (selectedProvider === 'openai') {
      response = await callOpenAI(message);
    } else {
      response = await callAnthropic(message);
    }

    // Show tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        addMessage('tool', `🔧 Calling MCP Tool: ${toolCall.name}\n\nArguments: ${JSON.stringify(toolCall.arguments, null, 2)}\n\nResult: ${JSON.stringify(toolCall.result, null, 2)}`);
        await sleep(300);
      }
    }

    // Show final response
    addMessage('assistant', response.text);

  } catch (err) {
    throw new Error(`API Error: ${err.message}`);
  }
}

async function callOpenAI(message) {
  // Define MCP tools in OpenAI format
  const tools = [
    {
      type: "function",
      function: {
        name: "listActiveTabs",
        description: "List all active browser tabs",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    },
    {
      type: "function",
      function: {
        name: "pinTab",
        description: "Pin a specific tab to this IDE session for focused context",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Session ID (unique per IDE window)" },
            tabId: { type: "number", description: "Tab ID to pin" }
          },
          required: ["sessionId", "tabId"]
        }
      }
    }
    // Add more tools as needed
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant with access to browser inspection tools via MCP. Help the user inspect and understand their browser tabs.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools: tools,
      tool_choice: 'auto'
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  // Handle tool calls
  const toolCalls = [];
  if (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Execute tool via extension message
      const result = await executeToolCall(toolName, toolArgs);

      toolCalls.push({
        name: toolName,
        arguments: toolArgs,
        result: result
      });
    }
  }

  return {
    text: assistantMessage.content || 'I called the tools for you. Check the results above!',
    toolCalls: toolCalls
  };
}

async function callAnthropic(message) {
  // Similar to OpenAI but using Claude API format
  // Implementation would be similar with Anthropic's tool calling format

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      tools: [
        {
          name: 'listActiveTabs',
          description: 'List all active browser tabs',
          input_schema: {
            type: 'object',
            properties: {}
          }
        }
        // Add more tools
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Process response (simplified)
  return {
    text: data.content[0].text,
    toolCalls: []
  };
}

async function executeToolCall(toolName, args) {
  // Send message to extension background to execute MCP tool
  // For now, return mock data
  return mockMCPResponses[toolName] || { success: true };
}

function addMessage(type, content) {
  const container = document.getElementById('chatContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'chat-message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  container.appendChild(messageDiv);

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
