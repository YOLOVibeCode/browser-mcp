/**
 * MCP-specific types.
 */
export type ResourceURI = string;
export interface MCPResource {
    uri: ResourceURI;
    mimeType: string;
    content: string | object;
}
export interface MCPToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
}
export interface MCPPrompt {
    name: string;
    description: string;
    content: string;
}
export interface TabInfo {
    tabId: number;
    url: string;
    title: string;
    port: number;
    framework: string | null;
    isActive: boolean;
    virtualFilesystemURI: string;
    activatedAt: number;
}
//# sourceMappingURL=MCPTypes.d.ts.map