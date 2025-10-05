/**
 * MCP-specific types.
 */

export type ResourceURI = string; // e.g., "browser://tab-localhost-3000/console/errors"

export interface MCPResource {
  uri: ResourceURI;
  mimeType: string; // "application/json", "text/html", "text/plain"
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
  activatedAt: number; // timestamp
}
