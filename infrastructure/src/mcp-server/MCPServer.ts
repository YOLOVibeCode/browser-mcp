import type {
  IMCPServer,
  MCPServerInfo,
  MCPCapabilities,
  MCPResourceProvider,
  MCPToolProvider,
  MCPPromptProvider,
} from '@browser-mcp/contracts/mcp-server';
import type { MCPResource, MCPToolResult } from '@browser-mcp/contracts/types';

export interface MCPServerConfig {
  name: string;
  version: string;
}

/**
 * Model Context Protocol Server implementation.
 * Exposes browser state to AI assistants via MCP protocol.
 * NO MOCKS - this is a real MCP server implementation.
 */
export class MCPServer implements IMCPServer {
  private initialized = false;
  private resources = new Map<string, MCPResourceProvider>();
  private tools = new Map<string, MCPToolProvider>();
  private prompts = new Map<string, MCPPromptProvider>();

  constructor(private config: MCPServerConfig) {}

  async initialize(): Promise<MCPServerInfo> {
    this.initialized = true;

    const capabilities: MCPCapabilities = {
      resources: true,
      tools: true,
      prompts: true,
    };

    return {
      name: this.config.name,
      version: this.config.version,
      capabilities,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  registerResource(provider: MCPResourceProvider): void {
    this.resources.set(provider.uri, provider);
  }

  unregisterResource(uri: string): void {
    this.resources.delete(uri);
  }

  async listResources(): Promise<MCPResource[]> {
    const resources: MCPResource[] = [];

    for (const provider of this.resources.values()) {
      resources.push({
        uri: provider.uri,
        mimeType: provider.mimeType || 'text/html',
        content: '', // Content is fetched separately via getResourceContent
      });
    }

    return resources;
  }

  async getResourceContent(uri: string): Promise<string> {
    const provider = this.resources.get(uri);

    if (!provider) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return provider.getContent();
  }

  registerTool(provider: MCPToolProvider): void {
    this.tools.set(provider.name, provider);
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  async listTools(): Promise<Array<{ name: string; description: string; inputSchema: any }>> {
    const tools: Array<{ name: string; description: string; inputSchema: any }> = [];

    for (const provider of this.tools.values()) {
      tools.push({
        name: provider.name,
        description: provider.description,
        inputSchema: provider.inputSchema,
      });
    }

    return tools;
  }

  async executeTool(name: string, params: any): Promise<MCPToolResult> {
    const provider = this.tools.get(name);

    if (!provider) {
      throw new Error(`Tool not found: ${name}`);
    }

    return provider.execute(params);
  }

  registerPrompt(provider: MCPPromptProvider): void {
    this.prompts.set(provider.name, provider);
  }

  unregisterPrompt(name: string): void {
    this.prompts.delete(name);
  }

  async listPrompts(): Promise<Array<{ name: string; description: string }>> {
    const prompts: Array<{ name: string; description: string }> = [];

    for (const provider of this.prompts.values()) {
      prompts.push({
        name: provider.name,
        description: provider.description,
      });
    }

    return prompts;
  }

  async getPrompt(name: string, args: Record<string, string>): Promise<string> {
    const provider = this.prompts.get(name);

    if (!provider) {
      throw new Error(`Prompt not found: ${name}`);
    }

    return provider.generate(args);
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.resources.clear();
    this.tools.clear();
    this.prompts.clear();
  }
}
