// Device fingerprinting for duplicate detection
// Uses canvas, audio, and browser characteristics

export interface FingerprintComponents {
    canvas: string;
    webgl: string;
    screen: string;
    timezone: string;
    language: string;
    platform: string;
    fonts: string;
    plugins: string;
}

export interface FingerprintResult {
    hash: string;
    components: FingerprintComponents;
}

// Simple hash function for fingerprint
async function hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// Canvas fingerprint
function getCanvasFingerprint(): string {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.font = '14px Arial';
        ctx.fillText('Nurse Survey 👩‍⚕️', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18px Times';
        ctx.fillText('Healthcare', 4, 45);

        return canvas.toDataURL().substring(0, 100);
    } catch {
        return 'canvas-error';
    }
}

// WebGL fingerprint
function getWebGLFingerprint(): string {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'no-webgl';

        const webgl = gl as WebGLRenderingContext;
        const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return 'webgl-no-debug';

        const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        return `${vendor}|${renderer}`;
    } catch {
        return 'webgl-error';
    }
}

// Screen fingerprint
function getScreenFingerprint(): string {
    return [
        screen.width,
        screen.height,
        screen.colorDepth,
        screen.pixelDepth,
        window.devicePixelRatio || 1
    ].join('|');
}

// Timezone fingerprint
function getTimezoneFingerprint(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    } catch {
        return new Date().getTimezoneOffset().toString();
    }
}

// Get available fonts (limited detection)
function getFontsFingerprint(): string {
    const testFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
        'Verdana', 'Courier New', 'Impact', 'Comic Sans MS'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-fonts';

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const baseWidths: Record<string, number> = {};
    baseFonts.forEach(font => {
        ctx.font = `${testSize} ${font}`;
        baseWidths[font] = ctx.measureText(testString).width;
    });

    const detectedFonts: string[] = [];
    testFonts.forEach(font => {
        for (const baseFont of baseFonts) {
            ctx.font = `${testSize} '${font}', ${baseFont}`;
            const width = ctx.measureText(testString).width;
            if (width !== baseWidths[baseFont]) {
                detectedFonts.push(font);
                break;
            }
        }
    });

    return detectedFonts.join(',');
}

// Get browser plugins
function getPluginsFingerprint(): string {
    const plugins = navigator.plugins;
    if (!plugins || plugins.length === 0) return 'no-plugins';

    const pluginNames: string[] = [];
    for (let i = 0; i < Math.min(plugins.length, 10); i++) {
        pluginNames.push(plugins[i].name);
    }

    return pluginNames.join(',');
}

// Generate complete fingerprint
export async function generateFingerprint(): Promise<FingerprintResult> {
    const components: FingerprintComponents = {
        canvas: getCanvasFingerprint(),
        webgl: getWebGLFingerprint(),
        screen: getScreenFingerprint(),
        timezone: getTimezoneFingerprint(),
        language: navigator.language || 'unknown',
        platform: navigator.platform || 'unknown',
        fonts: getFontsFingerprint(),
        plugins: getPluginsFingerprint()
    };

    const combinedString = Object.values(components).join('|');
    const hash = await hashString(combinedString);

    return { hash, components };
}

// Check if fingerprint indicates duplicate
export async function checkDuplicate(fingerprint: string): Promise<{
    isDuplicate: boolean;
    sessionCount: number;
}> {
    try {
        const response = await fetch('/api/fingerprint/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint })
        });

        if (!response.ok) {
            return { isDuplicate: false, sessionCount: 0 };
        }

        return await response.json();
    } catch {
        return { isDuplicate: false, sessionCount: 0 };
    }
}
