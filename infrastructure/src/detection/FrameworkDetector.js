export class FrameworkDetector {
    detectedFrameworks = new Map();
    detectFromGlobals(globalVars) {
        const detected = [];
        // React detection
        if (globalVars.React) {
            const version = globalVars.React.version || null;
            const info = {
                name: 'React',
                version,
                confidence: 'high',
                detectionMethod: 'window.React',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        // Vue detection
        if (globalVars.Vue) {
            const version = globalVars.Vue.version || null;
            const info = {
                name: 'Vue',
                version,
                confidence: 'high',
                detectionMethod: 'window.Vue',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        // Angular detection
        if (globalVars.ng) {
            const version = globalVars.ng.version?.full || null;
            const info = {
                name: 'Angular',
                version,
                confidence: 'high',
                detectionMethod: 'window.ng',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        // jQuery detection
        if (globalVars.jQuery) {
            const version = globalVars.jQuery.fn?.jquery || null;
            const info = {
                name: 'jQuery',
                version,
                confidence: 'high',
                detectionMethod: 'window.jQuery',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        return detected;
    }
    detectFromDOM(htmlContent) {
        const detected = [];
        // React detection
        if (htmlContent.includes('data-reactroot') || htmlContent.includes('data-react-root')) {
            const info = {
                name: 'React',
                version: null,
                confidence: 'medium',
                detectionMethod: 'DOM attributes (data-reactroot)',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        // Vue detection
        if (htmlContent.includes('v-cloak') || htmlContent.includes('v-app')) {
            const info = {
                name: 'Vue',
                version: null,
                confidence: 'medium',
                detectionMethod: 'DOM attributes (v-*)',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        // Angular detection
        const ngVersionMatch = htmlContent.match(/ng-version="([^"]+)"/);
        if (ngVersionMatch || htmlContent.includes('ng-version')) {
            const info = {
                name: 'Angular',
                version: null,
                confidence: 'medium',
                detectionMethod: 'DOM attributes (ng-version)',
            };
            detected.push(info);
            this.addToDetected(info);
        }
        return detected;
    }
    detectFromScripts(scriptSources) {
        const detected = [];
        for (const src of scriptSources) {
            // React detection
            const reactMatch = src.match(/react[@/](\d+\.\d+\.\d+)/);
            if (reactMatch) {
                const info = {
                    name: 'React',
                    version: reactMatch[1],
                    confidence: 'high',
                    detectionMethod: 'Script URL',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            else if (src.includes('react') && (src.includes('.js') || src.includes('.min'))) {
                const info = {
                    name: 'React',
                    version: null,
                    confidence: 'medium',
                    detectionMethod: 'Script URL (no version)',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            // Vue detection
            const vueMatch = src.match(/vue[@/](\d+\.\d+\.\d+)/);
            if (vueMatch) {
                const info = {
                    name: 'Vue',
                    version: vueMatch[1],
                    confidence: 'high',
                    detectionMethod: 'Script URL',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            else if (src.includes('vue') && (src.includes('.js') || src.includes('.min'))) {
                const info = {
                    name: 'Vue',
                    version: null,
                    confidence: 'medium',
                    detectionMethod: 'Script URL (no version)',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            // Angular detection
            const angularMatch = src.match(/angular[@/](\d+\.\d+\.\d+)/);
            if (angularMatch) {
                const info = {
                    name: 'Angular',
                    version: angularMatch[1],
                    confidence: 'high',
                    detectionMethod: 'Script URL',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            else if (src.includes('angular') && (src.includes('.js') || src.includes('.min'))) {
                const info = {
                    name: 'Angular',
                    version: null,
                    confidence: 'medium',
                    detectionMethod: 'Script URL (no version)',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            // jQuery detection
            const jqueryMatch = src.match(/jquery[@/-](\d+\.\d+\.\d+)/);
            if (jqueryMatch) {
                const info = {
                    name: 'jQuery',
                    version: jqueryMatch[1],
                    confidence: 'high',
                    detectionMethod: 'Script URL',
                };
                detected.push(info);
                this.addToDetected(info);
            }
            else if (src.includes('jquery') && (src.includes('.js') || src.includes('.min'))) {
                const info = {
                    name: 'jQuery',
                    version: null,
                    confidence: 'medium',
                    detectionMethod: 'Script URL (no version)',
                };
                detected.push(info);
                this.addToDetected(info);
            }
        }
        return detected;
    }
    getAllDetectedFrameworks() {
        return Array.from(this.detectedFrameworks.values());
    }
    addToDetected(info) {
        const existing = this.detectedFrameworks.get(info.name);
        if (!existing) {
            this.detectedFrameworks.set(info.name, info);
            return;
        }
        // Prefer high confidence over medium/low
        const confidenceRank = { high: 3, medium: 2, low: 1 };
        if (confidenceRank[info.confidence] > confidenceRank[existing.confidence]) {
            this.detectedFrameworks.set(info.name, info);
            return;
        }
        // If same confidence, prefer one with version
        if (info.confidence === existing.confidence && info.version && !existing.version) {
            this.detectedFrameworks.set(info.name, info);
        }
    }
}
//# sourceMappingURL=FrameworkDetector.js.map