import { describe, it, expect, beforeEach } from 'vitest';
import { FrameworkDetector } from './FrameworkDetector';
describe('FrameworkDetector', () => {
    let detector;
    beforeEach(() => {
        detector = new FrameworkDetector();
    });
    describe('detectFromGlobals', () => {
        it('should detect React from window.React', () => {
            const globals = {
                React: {
                    version: '18.3.1',
                },
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('React');
            expect(detected[0].version).toBe('18.3.1');
            expect(detected[0].confidence).toBe('high');
        });
        it('should detect Vue from window.Vue', () => {
            const globals = {
                Vue: {
                    version: '3.5.13',
                },
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('Vue');
            expect(detected[0].version).toBe('3.5.13');
            expect(detected[0].confidence).toBe('high');
        });
        it('should detect Angular from window.ng', () => {
            const globals = {
                ng: {
                    version: {
                        full: '17.0.0',
                    },
                },
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('Angular');
            expect(detected[0].version).toBe('17.0.0');
            expect(detected[0].confidence).toBe('high');
        });
        it('should detect jQuery from window.jQuery', () => {
            const globals = {
                jQuery: {
                    fn: {
                        jquery: '3.7.1',
                    },
                },
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('jQuery');
            expect(detected[0].version).toBe('3.7.1');
            expect(detected[0].confidence).toBe('high');
        });
        it('should return empty array when no frameworks detected', () => {
            const globals = {
                someRandomVar: 'value',
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(0);
        });
        it('should detect multiple frameworks', () => {
            const globals = {
                React: { version: '18.3.1' },
                jQuery: { fn: { jquery: '3.7.1' } },
            };
            const detected = detector.detectFromGlobals(globals);
            expect(detected).toHaveLength(2);
            expect(detected.map((f) => f.name)).toContain('React');
            expect(detected.map((f) => f.name)).toContain('jQuery');
        });
    });
    describe('detectFromDOM', () => {
        it('should detect React from data-reactroot attribute', () => {
            const html = '<div id="root" data-reactroot="">Content</div>';
            const detected = detector.detectFromDOM(html);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('React');
            expect(detected[0].confidence).toBe('medium');
        });
        it('should detect Vue from v-app or v-cloak attributes', () => {
            const html = '<div id="app" v-cloak>Content</div>';
            const detected = detector.detectFromDOM(html);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('Vue');
            expect(detected[0].confidence).toBe('medium');
        });
        it('should detect Angular from ng-version attribute', () => {
            const html = '<app-root ng-version="17.0.0">Content</app-root>';
            const detected = detector.detectFromDOM(html);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('Angular');
            expect(detected[0].confidence).toBe('medium');
        });
        it('should return empty array for plain HTML', () => {
            const html = '<div id="app">Plain HTML</div>';
            const detected = detector.detectFromDOM(html);
            expect(detected).toHaveLength(0);
        });
    });
    describe('detectFromScripts', () => {
        it('should detect React from script URLs', () => {
            const scripts = [
                'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
            ];
            const detected = detector.detectFromScripts(scripts);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('React');
            expect(detected[0].version).toBe('18.3.1');
            expect(detected[0].confidence).toBe('high');
        });
        it('should detect Vue from script URLs', () => {
            const scripts = ['https://unpkg.com/vue@3.5.13/dist/vue.global.js'];
            const detected = detector.detectFromScripts(scripts);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('Vue');
            expect(detected[0].version).toBe('3.5.13');
            expect(detected[0].confidence).toBe('high');
        });
        it('should detect frameworks without version from URLs', () => {
            const scripts = ['https://unpkg.com/react/umd/react.production.min.js'];
            const detected = detector.detectFromScripts(scripts);
            expect(detected).toHaveLength(1);
            expect(detected[0].name).toBe('React');
            expect(detected[0].version).toBeNull();
            expect(detected[0].confidence).toBe('medium');
        });
        it('should return empty array when no framework scripts found', () => {
            const scripts = ['https://example.com/custom-script.js'];
            const detected = detector.detectFromScripts(scripts);
            expect(detected).toHaveLength(0);
        });
    });
    describe('getAllDetectedFrameworks', () => {
        it('should combine results from all detection methods', () => {
            const globals = { React: { version: '18.3.1' } };
            const html = '<div data-reactroot="">Content</div>';
            const scripts = ['https://unpkg.com/vue@3.5.13/dist/vue.global.js'];
            detector.detectFromGlobals(globals);
            detector.detectFromDOM(html);
            detector.detectFromScripts(scripts);
            const all = detector.getAllDetectedFrameworks();
            expect(all.length).toBeGreaterThanOrEqual(2);
            expect(all.some((f) => f.name === 'React')).toBe(true);
            expect(all.some((f) => f.name === 'Vue')).toBe(true);
        });
        it('should deduplicate frameworks with same name', () => {
            const globals = { React: { version: '18.3.1' } };
            const html = '<div data-reactroot="">Content</div>';
            detector.detectFromGlobals(globals);
            detector.detectFromDOM(html);
            const all = detector.getAllDetectedFrameworks();
            const reactDetections = all.filter((f) => f.name === 'React');
            expect(reactDetections).toHaveLength(1);
            expect(reactDetections[0].confidence).toBe('high'); // Should prefer high confidence
        });
        it('should return empty array when nothing detected', () => {
            const all = detector.getAllDetectedFrameworks();
            expect(all).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=FrameworkDetector.test.js.map