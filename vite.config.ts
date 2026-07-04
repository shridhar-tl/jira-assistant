import fs from 'fs';
import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fluxoUiSource } from 'fluxo-ui/vite-plugin';
import { defineConfig, build as viteBuild, type Plugin } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import mkcert from 'vite-plugin-mkcert';
import svgr from 'vite-plugin-svgr';
import webfontDownload from 'vite-plugin-webfont-dl';

const isProdMode = process.env.NODE_ENV === 'production';
// Set JA_DEBUG_BUILD=1 to produce an unminified build (readable variable names in the
// background service worker and content scripts). Sourcemaps aren't used since they don't
// load in extension contexts anyway.
const isDebugBuild = process.env.JA_DEBUG_BUILD === '1' || process.env.JA_DEBUG_BUILD === 'true';
const shouldMinify = isProdMode && !isDebugBuild;

const listenerPort = parseInt(process.env.PORT || '0');

const buildModeMap: Record<string, string> = {
    WEB: 'web',
    APP: 'app',
    PLUGIN: 'plugin',
    EXTN: '',
};
const buildMode = process.env.VITE_BUILD_MODE || '';
const buildVariant = buildModeMap[buildMode] ?? '';
const isExtnBuild = buildMode === 'EXTN' || buildMode === '';
const variantExtensions = ['.tsx', '.ts']; //, '.jsx', '.js'
const variantSuffixes = ['web', 'app', 'plugin']; // ToDo: This has to be looked at: , 'common', 'background', 'menu', 'register'

const srcDir = path.resolve(__dirname, './src');

const aliases: Record<string, string> = {
    '@': srcDir,
    '@services': path.resolve(srcDir, 'services'),
    '@utils': path.resolve(srcDir, 'utils'),
    '@components': path.resolve(srcDir, 'components'),
    '@pages': path.resolve(srcDir, 'pages'),
    '@stores': path.resolve(srcDir, 'stores'),
    '@types': path.resolve(srcDir, 'types'),
    '@hooks': path.resolve(srcDir, 'hooks'),
    '@constants': path.resolve(srcDir, 'constants'),
    '@layouts': path.resolve(srcDir, 'layouts'),
    '@dialogs': path.resolve(srcDir, 'dialogs'),
    '@controls': path.resolve(srcDir, 'controls'),
    '@assets': path.resolve(srcDir, 'assets'),
};

function hasVariantSuffix(filePath: string): boolean {
    const basename = path.basename(filePath, path.extname(filePath));
    const dot = basename.lastIndexOf('.');
    if (dot === -1) return false;
    return variantSuffixes.includes(basename.substring(dot + 1));
}

function findVariant(base: string): string | null {
    if (!buildVariant) {
        return null;
    }
    for (const ext of variantExtensions) {
        const variantPath = `${base}.${buildVariant}${ext}`;
        if (fs.existsSync(variantPath)) {
            return variantPath;
        }
    }
    return null;
}

function tryVariantPath(filePath: string): string | null {
    if (hasVariantSuffix(filePath)) {
        return null;
    }

    const ext = path.extname(filePath);
    const base = ext ? filePath.slice(0, -ext.length) : filePath;

    const result = findVariant(base);
    if (result) return result;

    if (!ext) {
        try {
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                const indexVariant = findVariant(path.join(filePath, 'index'));
                if (indexVariant) return indexVariant;
            }
        } catch {
            /* ignore */
        }
    }

    return null;
}

function resolveAlias(source: string): string | null {
    const sortedKeys = Object.keys(aliases).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (source === key) {
            return aliases[key];
        }
        if (source.startsWith(key + '/')) {
            return path.resolve(aliases[key], source.slice(key.length + 1));
        }
    }
    return null;
}

function buildVariantPlugin(): Plugin {
    return {
        name: 'build-variant-resolver',
        enforce: 'pre',
        async resolveId(source, importer, options) {
            if (!importer || source.startsWith('\0')) {
                return null;
            }

            if (source.startsWith('.')) {
                const importerDir = path.dirname(importer);
                const resolved = path.resolve(importerDir, source);

                const variantPath = tryVariantPath(resolved);
                if (variantPath) {
                    // If the variant path would resolve to the importer itself,
                    // don't substitute with the variant (that would create a
                    // self-import). Instead return the non-variant resolved path
                    // so the importer can import the base file.
                    if (path.resolve(variantPath) === path.resolve(importer)) {
                        if (fs.existsSync(resolved)) return resolved;
                        return null;
                    }

                    return variantPath;
                }

                return null;
            }

            const aliasResolved = resolveAlias(source);
            if (!aliasResolved) return null;

            const variantPath = tryVariantPath(aliasResolved);
            if (variantPath) return variantPath;

            const fromVite = await this.resolve(aliasResolved, importer, { ...options, skipSelf: true });
            return fromVite;
        },
    };
}

const htmlPlugin = createHtmlPlugin({
    minify: shouldMinify && {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyJS: true,
        minifyCSS: true,
    },
});

// For extension build, we need a few extra entries (background service worker and
// content script) that must live at fixed, hash-less paths so manifest.json files
// can reference them. IIFE format requires one entry per build, so we run a
// secondary Vite build per script after the main build wraps up.
async function buildExtnExtraEntry(name: string, entryFile: string) {
    await viteBuild({
        configFile: false,
        mode: process.env.NODE_ENV || 'production',
        publicDir: false,
        resolve: { alias: aliases },
        plugins: [buildVariantPlugin()],
        define: {
            'import.meta.env.VITE_BUILD_MODE': JSON.stringify(buildMode),
        },
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            sourcemap: false,
            minify: shouldMinify,
            target: 'es2020',
            cssCodeSplit: false,
            rollupOptions: {
                input: { [name]: path.resolve(srcDir, entryFile) },
                output: {
                    format: 'iife',
                    entryFileNames: '[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                            return `${name}.css`;
                        }
                        return '[name][extname]';
                    },
                    inlineDynamicImports: true,
                    manualChunks: undefined,
                },
                preserveEntrySignatures: false,
            },
        },
    });
}

function extnExtrasBuilder(): Plugin {
    return {
        name: 'extn-extras-builder',
        apply: 'build',
        async closeBundle() {
            if (!isExtnBuild) return;
            if (process.env.VITE_EXTN_EXTRAS === '1') return;

            process.env.VITE_EXTN_EXTRAS = '1';
            try {
                await buildExtnExtraEntry('background', 'common/background.ts');
                // background.ts has no DOM; any CSS pulled in transitively (e.g. via UI-aware
                // services that the background script never actually uses for rendering) is dead
                // weight in the service worker bundle, so discard it.
                const backgroundCss = path.resolve(__dirname, 'dist/background.css');
                if (fs.existsSync(backgroundCss)) {
                    fs.unlinkSync(backgroundCss);
                }
                await buildExtnExtraEntry('jira_cs', 'content-scripts/jira.ts');
            } finally {
                delete process.env.VITE_EXTN_EXTRAS;
            }
        },
    };
}

const isPluginBuild = buildMode === 'PLUGIN';
const isAppBuild = buildMode === 'APP';

export default defineConfig({
    // Forge plugin and Electron app are loaded as static assets from a non-root URL,
    // so emit relative asset paths (./assets/...) instead of absolute ones.
    base: isPluginBuild || isAppBuild ? './' : '/',
    plugins: [
        mkcert({
            hosts: ['local.jiraassistant.com'],
        }),
        fluxoUiSource({ sourcePath: '../../fluxo-ui/src' }),
        buildVariantPlugin(),
        react(),
        tailwindcss(),
        webfontDownload(
            ['https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'],
            {
                injectAsStyleTag: false,
                async: false,
                assetsSubfolder: 'fonts',
                minifyCss: true,
                embedFonts: false,
                cache: true,
            },
        ),
        svgr({
            svgrOptions: {},
            include: '**/*.svg?react',
        }),
        htmlPlugin as any,
        extnExtrasBuilder(),
    ],
    resolve: {},
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: shouldMinify,
        rollupOptions: {
            input: isExtnBuild
                ? {
                      index: path.resolve(__dirname, 'index.html'),
                      menu: path.resolve(__dirname, 'menu.html'),
                  }
                : undefined,
            output: {
                manualChunks(id) {
                    if (
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-router-dom/')
                    ) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/chart.js/')) {
                        return 'vendor-charts';
                    }
                    if (
                        id.includes('node_modules/moment/') ||
                        id.includes('node_modules/moment-timezone/') ||
                        id.includes('node_modules/dexie/')
                    ) {
                        return 'vendor-utils';
                    }
                },
            },
        },
    },
    // Build server config as a single object so TS infers a consistent shape
    server: ((): any => {
        if (listenerPort) {
            return {
                port: listenerPort,
                https: false,
                open: false,
            };
        }

        return {
            host: 'local.jiraassistant.com', // Set the dev server host
            port: 443,
            open: 'https://local.jiraassistant.com',
            allowedHosts: ['local.jiraassistant.com'],
        };
    })(),
});
