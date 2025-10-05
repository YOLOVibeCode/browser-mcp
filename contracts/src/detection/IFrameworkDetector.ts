export interface FrameworkInfo {
  name: string;
  version: string | null;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: string;
}

export interface IFrameworkDetector {
  /**
   * Detect frameworks in the page by analyzing global variables
   */
  detectFromGlobals(globalVars: Record<string, any>): FrameworkInfo[];

  /**
   * Detect frameworks from DOM elements (e.g., React root, Vue app markers)
   */
  detectFromDOM(htmlContent: string): FrameworkInfo[];

  /**
   * Detect frameworks from script tags and their sources
   */
  detectFromScripts(scriptSources: string[]): FrameworkInfo[];

  /**
   * Get all detected frameworks with combined results
   */
  getAllDetectedFrameworks(): FrameworkInfo[];
}
