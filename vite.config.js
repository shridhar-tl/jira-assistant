import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import alias from '@rollup/plugin-alias';
import EnvCompatible from 'vite-plugin-env-compatible';
//import { minifyHTMLLiterals } from 'minify-html-literals';
import { createHtmlPlugin } from 'vite-plugin-html';
import fs from 'fs-extra';
import path from 'path';
import packageJSON from './package.json';

// Environment variables
process.env.VITE_BUILD_DATE = new Date().getTime();
const buildMode = process.env.VITE_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isPluginBuild = buildMode === 'PLUGIN';
const isExtnBuild = !isWebBuild && !isAppBuild && !isPluginBuild;

//const writeToDisk = process.env.WRITE_TO_DISK === "true";
//const analyzeBundles = process.env.ANALYZE_BUNDLES === "true";
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP === 'true';
//const shouldUseSourceMap_CSS = process.env.GENERATE_CSS_SOURCEMAP === 'true';

const appDirectory = fs.realpathSync(process.cwd());
const resolvePath = relativePath => path.resolve(appDirectory, relativePath);

const modulesWithoutHashName = ['background', 'content', 'jira_cs', 'electron', 'preload'];
const aliasPaths = getAliasPackages(packageJSON.aliases);

function getAliasPackages(packages) {
    return Object.keys(packages).reduce((obj, key) => {
        let pack = packages[key];
        if (!Array.isArray(pack)) {
            pack = [pack];
        }

        for (const srcPath of pack) {
            const fullPath = path.join(process.cwd(), srcPath);
            if (fs.existsSync(fullPath)) {
                obj[key] = fullPath;
                return obj;
            }
            console.warn(`Package Key:- ${key}; "${srcPath}" not found. Please validate "aliases" in "package.json"`);
        }

        throw Error(`Dependency package not loaded. Package Key:- ${key}`);
    }, {});
}

export default defineConfig({
    server: {
        port: 80,
        host: '0.0.0.0',
        //watch: { usePolling: writeToDisk },
    },
    plugins: [
        react(),
        alias({
            entries: aliasPaths
        }),
        EnvCompatible(),
        createHtmlPlugin({
            minify: process.env.NODE_ENV === 'production' ? {
                collapseWhitespace: true,
                keepClosingSlash: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyJS: true,
                minifyCSS: true,
            } : false
        }),
        //minifyHTMLLiterals()
    ],
    build: {
        sourcemap: shouldUseSourceMap,
        rollupOptions: {
            input: getEntryObject(appDirectory),
            output: {
                dir: 'build',
                assetFileNames: chunkInfo => {
                    if (modulesWithoutHashName.includes(chunkInfo.name)) {
                        return 'static/js/[name].js';
                    } else if (chunkInfo.name === 'jira_cs') {
                        return 'static/css/[name].css';
                    }
                    return `static/js/[name].[hash].js`;
                },
                entryFileNames: chunkInfo => modulesWithoutHashName.includes(chunkInfo.name)
                    ? 'static/js/[name].js'
                    : 'static/js/[name].[hash].js',
            },
        },
    },
    resolve: {
        alias: aliasPaths,
        extensions: isWebBuild ? ['.web.jsx', '.jsx', '.web.js', '.js'] : [`.${buildMode.toLowerCase()}.jsx`, '.jsx', `.${buildMode.toLowerCase()}.js`, '.js']
    },
});

function getEntryObject(paths) {
    const result = {
        index: resolvePath('index.html')
    };

    if (isExtnBuild) {
        result.background = resolvePath('src/common/background.js');
        result.menu = resolvePath('menu.html');
        result.jira_cs = resolvePath('src/content-scripts/jira.js');
    } else if (isPluginBuild) {
        result.index = resolvePath('src/index.plugin.jsx');
    }

    return result;
}