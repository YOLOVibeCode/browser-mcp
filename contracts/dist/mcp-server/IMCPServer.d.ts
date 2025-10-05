import type { MCPResource, MCPToolResult } from '../types/MCPTypes';
/**
 * MCP Server capability flags
 */
export interface MCPCapabilities {
    resources: boolean;
    tools: boolean;
    prompts: boolean;
}
/**
 * MCP Server initialization info
 */
export interface MCPServerInfo {
    name: string;
    version: string;
    capabilities: MCPCapabilities;
}
/**
 * MCP Resource registration
 */
export interface MCPResourceProvider {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    getContent: () => Promise<string>;
}
/**
 * MCP Tool registration
 */
export interface MCPToolProvider {
    name: string;
    description: string;
    inputSchema: any;
    execute: (params: any) => Promise<MCPToolResult>;
}
/**
 * MCP Prompt registration
 */
export interface MCPPromptProvider {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
    generate: (args: Record<string, string>) => Promise<string>;
}
/**
 * Model Context Protocol Server interface.
 * Exposes browser state to AI assistants via MCP protocol.
 */
export interface IMCPServer {
    /**
     * Initialize the MCP server.
     */
    initialize(): Promise<MCPServerInfo>;
    /**
     * Check if server is initialized.
     */
    isInitialized(): boolean;
    /**
     * Register a resource provider (e.g., virtual filesystem for a tab).
     */
    registerResource(provider: MCPResourceProvider): void;
    /**
     * Unregister a resource by URI.
     */
    unregisterResource(uri: string): void;
    /**
     * Get all registered resources.
     */
    listResources(): Promise<MCPResource[]>;
    /**
     * Get resource content by URI.
     */
    getResourceContent(uri: string): Promise<string>;
    /**
     * Register a tool provider (e.g., execute JavaScript, navigate tab).
     */
    registerTool(provider: MCPToolProvider): void;
    /**
     * Unregister a tool by name.
     */
    unregisterTool(name: string): void;
    /**
     * List all registered tools.
     */
    listTools(): Promise<Array<{
        name: string;
        description: string;
        inputSchema: any;
    }>>;
    /**
     * Execute a tool by name with parameters.
     */
    executeTool(name: string, params: any): Promise<MCPToolResult>;
    /**
     * Register a prompt provider.
     */
    registerPrompt(provider: MCPPromptProvider): void;
    /**
     * Unregister a prompt by name.
     */
    unregisterPrompt(name: string): void;
    /**
     * List all registered prompts.
     */
    listPrompts(): Promise<Array<{
        name: string;
        description: string;
    }>>;
    /**
     * Get a prompt content by name with arguments.
     */
    getPrompt(name: string, args: Record<string, string>): Promise<string>;
    /**
     * Shutdown the server.
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=IMCPServer.d.ts.map