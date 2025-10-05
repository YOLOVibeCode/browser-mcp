import type { IFrameworkDetector, FrameworkInfo } from '@browser-mcp/contracts/detection';
export declare class FrameworkDetector implements IFrameworkDetector {
    private detectedFrameworks;
    detectFromGlobals(globalVars: Record<string, any>): FrameworkInfo[];
    detectFromDOM(htmlContent: string): FrameworkInfo[];
    detectFromScripts(scriptSources: string[]): FrameworkInfo[];
    getAllDetectedFrameworks(): FrameworkInfo[];
    private addToDetected;
}
//# sourceMappingURL=FrameworkDetector.d.ts.map