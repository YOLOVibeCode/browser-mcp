/**
 * Model Context Protocol Server implementation.
 * Exposes browser state to AI assistants via MCP protocol.
 * NO MOCKS - this is a real MCP server implementation.
 */
export class MCPServer {
    config;
    initialized = false;
    resources = new Map();
    tools = new Map();
    prompts = new Map();
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        this.initialized = true;
        const capabilities = {
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
    isInitialized() {
        return this.initialized;
    }
    registerResource(provider) {
        this.resources.set(provider.uri, provider);
    }
    unregisterResource(uri) {
        this.resources.delete(uri);
    }
    async listResources() {
        const resources = [];
        for (const provider of this.resources.values()) {
            resources.push({
                uri: provider.uri,
                mimeType: provider.mimeType || 'text/html',
                content: '', // Content is fetched separately via getResourceContent
            });
        }
        return resources;
    }
    async getResourceContent(uri) {
        const provider = this.resources.get(uri);
        if (!provider) {
            throw new Error(`Resource not found: ${uri}`);
        }
        return provider.getContent();
    }
    registerTool(provider) {
        this.tools.set(provider.name, provider);
    }
    unregisterTool(name) {
        this.tools.delete(name);
    }
    async listTools() {
        const tools = [];
        for (const provider of this.tools.values()) {
            tools.push({
                name: provider.name,
                description: provider.description,
                inputSchema: provider.inputSchema,
            });
        }
        return tools;
    }
    async executeTool(name, params) {
        const provider = this.tools.get(name);
        if (!provider) {
            throw new Error(`Tool not found: ${name}`);
        }
        return provider.execute(params);
    }
    registerPrompt(provider) {
        this.prompts.set(provider.name, provider);
    }
    unregisterPrompt(name) {
        this.prompts.delete(name);
    }
    async listPrompts() {
        const prompts = [];
        for (const provider of this.prompts.values()) {
            prompts.push({
                name: provider.name,
                description: provider.description,
            });
        }
        return prompts;
    }
    async getPrompt(name, args) {
        const provider = this.prompts.get(name);
        if (!provider) {
            throw new Error(`Prompt not found: ${name}`);
        }
        return provider.generate(args);
    }
    async shutdown() {
        this.initialized = false;
        this.resources.clear();
        this.tools.clear();
        this.prompts.clear();
    }
}
//# sourceMappingURL=MCPServer.js.map