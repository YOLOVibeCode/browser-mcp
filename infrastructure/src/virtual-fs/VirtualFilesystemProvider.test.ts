import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualFilesystemProvider } from './VirtualFilesystemProvider';

describe('VirtualFilesystemProvider', () => {
  let provider: VirtualFilesystemProvider;

  beforeEach(() => {
    provider = new VirtualFilesystemProvider();
  });

  describe('getBaseURI', () => {
    it('should generate base URI for localhost', () => {
      const uri = provider.getBaseURI('http://localhost:3000');

      expect(uri).toBe('browser://tab-localhost-3000/');
    });

    it('should generate base URI for domain', () => {
      const uri = provider.getBaseURI('https://example.com');

      expect(uri).toBe('browser://tab-example-com/');
    });

    it('should handle domain with port', () => {
      const uri = provider.getBaseURI('https://example.com:8080');

      expect(uri).toBe('browser://tab-example-com-8080/');
    });

    it('should handle subdomain', () => {
      const uri = provider.getBaseURI('https://api.example.com');

      expect(uri).toBe('browser://tab-api-example-com/');
    });
  });

  describe('createResourcesForTab', () => {
    it('should create 4 resource providers for a tab', () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');

      expect(resources).toHaveLength(4);
      expect(resources[0].uri).toContain('dom/html');
      expect(resources[1].uri).toContain('console/logs');
      expect(resources[2].uri).toContain('network/requests');
      expect(resources[3].uri).toContain('metadata/frameworks');
    });

    it('should create resource with correct URIs', () => {
      const resources = provider.createResourcesForTab(1, 'https://example.com');

      expect(resources[0].uri).toBe('browser://tab-example-com/dom/html');
      expect(resources[1].uri).toBe('browser://tab-example-com/console/logs');
      expect(resources[2].uri).toBe('browser://tab-example-com/network/requests');
      expect(resources[3].uri).toBe('browser://tab-example-com/metadata/frameworks');
    });

    it('should set correct mime types', () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');

      expect(resources[0].mimeType).toBe('text/html');
      expect(resources[1].mimeType).toBe('application/json');
      expect(resources[2].mimeType).toBe('application/json');
      expect(resources[3].mimeType).toBe('application/json');
    });
  });

  describe('setDOMContent', () => {
    it('should store DOM content for tab', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');
      provider.setDOMContent(1, '<html><body>Hello</body></html>');

      const content = await resources[0].getContent();

      expect(content).toBe('<html><body>Hello</body></html>');
    });

    it('should return empty string if no content set', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');

      const content = await resources[0].getContent();

      expect(content).toBe('');
    });
  });

  describe('setConsoleLogs', () => {
    it('should store console logs for tab', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');
      const logs = [
        { level: 'log', message: 'Hello' },
        { level: 'error', message: 'Error!' },
      ];

      provider.setConsoleLogs(1, logs);

      const content = await resources[1].getContent();
      const parsed = JSON.parse(content);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Hello');
      expect(parsed[1].level).toBe('error');
    });

    it('should return empty array if no logs set', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');

      const content = await resources[1].getContent();
      const parsed = JSON.parse(content);

      expect(parsed).toEqual([]);
    });
  });

  describe('setNetworkRequests', () => {
    it('should store network requests for tab', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');
      const requests = [
        { url: 'https://api.example.com', method: 'GET' },
        { url: 'https://api.example.com/data', method: 'POST' },
      ];

      provider.setNetworkRequests(1, requests);

      const content = await resources[2].getContent();
      const parsed = JSON.parse(content);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].url).toBe('https://api.example.com');
      expect(parsed[1].method).toBe('POST');
    });
  });

  describe('setFrameworks', () => {
    it('should store detected frameworks for tab', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');
      const frameworks = [
        { name: 'React', version: '18.3.1', confidence: 'high' },
        { name: 'jQuery', version: '3.7.1', confidence: 'medium' },
      ];

      provider.setFrameworks(1, frameworks);

      const content = await resources[3].getContent();
      const parsed = JSON.parse(content);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('React');
      expect(parsed[1].version).toBe('3.7.1');
    });
  });

  describe('clearTab', () => {
    it('should clear all data for tab', async () => {
      const resources = provider.createResourcesForTab(1, 'http://localhost:3000');

      provider.setDOMContent(1, '<html>Test</html>');
      provider.setConsoleLogs(1, [{ level: 'log', message: 'test' }]);

      provider.clearTab(1);

      const domContent = await resources[0].getContent();
      const logContent = await resources[1].getContent();

      expect(domContent).toBe('');
      expect(JSON.parse(logContent)).toEqual([]);
    });
  });

  describe('multiple tabs', () => {
    it('should handle multiple tabs independently', async () => {
      const resources1 = provider.createResourcesForTab(1, 'http://localhost:3000');
      const resources2 = provider.createResourcesForTab(2, 'https://example.com');

      provider.setDOMContent(1, '<html>Tab 1</html>');
      provider.setDOMContent(2, '<html>Tab 2</html>');

      const content1 = await resources1[0].getContent();
      const content2 = await resources2[0].getContent();

      expect(content1).toBe('<html>Tab 1</html>');
      expect(content2).toBe('<html>Tab 2</html>');
    });
  });
});
