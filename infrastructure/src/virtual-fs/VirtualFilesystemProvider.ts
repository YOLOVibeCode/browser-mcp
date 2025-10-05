import type { IVirtualFilesystemProvider } from '@browser-mcp/contracts/virtual-fs';
import type { MCPResourceProvider } from '@browser-mcp/contracts/mcp-server';

interface TabData {
  domContent: string;
  consoleLogs: any[];
  networkRequests: any[];
  frameworks: any[];
}

/**
 * Virtual filesystem provider for browser tabs.
 * Maps browser state to virtual URIs.
 * NO MOCKS - real data storage.
 */
export class VirtualFilesystemProvider implements IVirtualFilesystemProvider {
  private tabData = new Map<number, TabData>();

  getBaseURI(url: string): string {
    const urlObj = new URL(url);
    let host = urlObj.hostname;
    if (urlObj.port) {
      host += `-${urlObj.port}`;
    }
    const safeName = host.replace(/\./g, '-').replace(/:/g, '-');
    return `browser://tab-${safeName}/`;
  }

  createResourcesForTab(tabId: number, url: string): MCPResourceProvider[] {
    const baseURI = this.getBaseURI(url);

    // Initialize tab data if not exists
    if (!this.tabData.has(tabId)) {
      this.tabData.set(tabId, {
        domContent: '',
        consoleLogs: [],
        networkRequests: [],
        frameworks: [],
      });
    }

    return [
      // DOM HTML resource
      {
        uri: `${baseURI}dom/html`,
        name: `DOM HTML - ${url}`,
        description: `HTML content of tab ${tabId}`,
        mimeType: 'text/html',
        getContent: async () => {
          const data = this.tabData.get(tabId);
          return data?.domContent || '';
        },
      },

      // Console logs resource
      {
        uri: `${baseURI}console/logs`,
        name: `Console Logs - ${url}`,
        description: `Console logs from tab ${tabId}`,
        mimeType: 'application/json',
        getContent: async () => {
          const data = this.tabData.get(tabId);
          return JSON.stringify(data?.consoleLogs || [], null, 2);
        },
      },

      // Network requests resource
      {
        uri: `${baseURI}network/requests`,
        name: `Network Requests - ${url}`,
        description: `Network requests from tab ${tabId}`,
        mimeType: 'application/json',
        getContent: async () => {
          const data = this.tabData.get(tabId);
          return JSON.stringify(data?.networkRequests || [], null, 2);
        },
      },

      // Frameworks metadata resource
      {
        uri: `${baseURI}metadata/frameworks`,
        name: `Detected Frameworks - ${url}`,
        description: `Detected JavaScript frameworks in tab ${tabId}`,
        mimeType: 'application/json',
        getContent: async () => {
          const data = this.tabData.get(tabId);
          return JSON.stringify(data?.frameworks || [], null, 2);
        },
      },
    ];
  }

  setDOMContent(tabId: number, content: string): void {
    const data = this.tabData.get(tabId);
    if (data) {
      data.domContent = content;
    }
  }

  setConsoleLogs(tabId: number, logs: any[]): void {
    const data = this.tabData.get(tabId);
    if (data) {
      data.consoleLogs = logs;
    }
  }

  setNetworkRequests(tabId: number, requests: any[]): void {
    const data = this.tabData.get(tabId);
    if (data) {
      data.networkRequests = requests;
    }
  }

  setFrameworks(tabId: number, frameworks: any[]): void {
    const data = this.tabData.get(tabId);
    if (data) {
      data.frameworks = frameworks;
    }
  }

  clearTab(tabId: number): void {
    this.tabData.delete(tabId);
  }
}
