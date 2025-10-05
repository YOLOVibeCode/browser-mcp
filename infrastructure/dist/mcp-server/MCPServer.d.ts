import type { IMCPServer, MCPServerInfo, MCPResourceProvider, MCPToolProvider, MCPPromptProvider } from '@browser-mcp/contracts/mcp-server';
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
export declare class MCPServer implements IMCPServer {
    private config;
    private initialized;
    private resources;
    private tools;
    private prompts;
    constructor(config: MCPServerConfig);
    initialize(): Promise<MCPServerInfo>;
    isInitialized(): boolean;
    registerResource(provider: MCPResourceProvider): void;
    unregisterResource(uri: string): void;
    listResources(): Promise<MCPResource[]>;
    getResourceContent(uri: string): Promise<string>;
    registerTool(provider: MCPToolProvider): void;
    unregisterTool(name: string): void;
    listTools(): Promise<Array<{
        name: string;
        description: string;
        inputSchema: any;
    }>>;
    executeTool(name: string, params: any): Promise<MCPToolResult>;
    registerPrompt(provider: MCPPromptProvider): void;
    unregisterPrompt(name: string): void;
    listPrompts(): Promise<Array<{
        name: string;
        description: string;
    }>>;
    getPrompt(name: string, args: Record<string, string>): Promise<string>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=MCPServer.d.ts.map