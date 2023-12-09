//const { whenDev, whenProd, ESLINT_MODES, POSTCSS_MODES } = require("@craco/craco");
const fs = require('fs-extra');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

process.env.REACT_APP_BUILD_DATE = new Date().getTime();
const buildMode = process.env.REACT_APP_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isPluginBuild = buildMode === 'PLUGIN';
const isExtnBuild = !isWebBuild && !isAppBuild && !isPluginBuild;

const writeToDisk = process.env.WRITE_TO_DISK === "true";
const analyzeBundles = process.env.ANALYZE_BUNDLES === "true";
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP === 'true';
const shouldUseSourceMap_CSS = process.env.GENERATE_CSS_SOURCEMAP === 'true';

const appDirectory = fs.realpathSync(process.cwd());
const resolvePath = relativePath => path.resolve(appDirectory, relativePath);

const modulesWithoutHashName = ['background', 'content', 'jira_cs', 'electron', 'preload'];

const packageJSON = fs.readJsonSync('./package.json');
const alias = getAliasPackages(packageJSON.aliases);

function overrideWebPackConfig(wpConfig, { paths }) {
    const isProd = wpConfig.mode === 'production';

    if (!isProd && writeToDisk) {
        wpConfig.devServer = { writeToDisk: true };
    }

    console.log('Homepage configured=', wpConfig.output.publicPath);

    // Use js specific for build target to be pulled while importing a file
    if (!isWebBuild) { // As .web.js is already part of module extns, no need to customize for web build
        // Caution: This may cause issue when there is some .web.js files in any any npm packages
        const extns = wpConfig.resolve.extensions.filter(ext => !ext.includes('.web.js')); // Remove .web.js
        const jsIdx = extns.indexOf('.js');
        extns.splice(jsIdx, 0, `.${buildMode.toLowerCase()}.js`);
        wpConfig.resolve.extensions = extns;
    }

    // set entry point
    wpConfig.entry = getEntryObject(paths);

    // Set the output file name without content hash for some of the entries
    if (isProd) {
        const existingJSFileName = wpConfig.output.filename;
        wpConfig.output.filename = (pathData) => (
            modulesWithoutHashName
                .includes(pathData.chunk.name)
                ? 'static/js/[name].js'
                : existingJSFileName
        );

        const miniCss = wpConfig.plugins.filter(p => p instanceof MiniCssExtractPlugin)[0];
        const existingCSSFileName = miniCss.options.filename;
        miniCss.options.filename = (pathData) => (pathData.chunk.name === 'jira_cs'
            ? 'static/css/[name].css'
            : existingCSSFileName
        );
        /*
        if (shouldUseSourceMap && !shouldUseSourceMap_CSS) {
            const filesList = ['.module.scss', '.module.sass', '.module.css'];
            wpConfig.module.rules.forEach(rule => {
                if (Array.isArray(rule.oneOf)) {
                    rule.oneOf.forEach(r => {
                        if (!(r.test instanceof RegExp) || !filesList.some(f => r.test.test(f))) {
                            return;
                        }

                        if (Array.isArray(r.use)) {
                            r.use.forEach(styleLoaderOptions);
                        }
                    });
                }
            });
        }*/
    }

    if (isAppBuild) {
        const config = [wpConfig, getElectronMain(wpConfig), getElectronRenderer(wpConfig)];
        config.output = { publicPath: wpConfig.publicPath };
        return config;
    } else {
        return wpConfig;
    }
}

function addPlugins(_, { getHTMLPlugin }) {
    const pluginsToAdd = [getHTMLPlugin("index.html", resolvePath('public/index.html'), ['index'], true)];

    if (isExtnBuild) {
        pluginsToAdd.push(getHTMLPlugin("menu.html", resolvePath('public/menu.html'), ['menu'], true));
    }

    if (analyzeBundles) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        pluginsToAdd.push(new BundleAnalyzerPlugin({
            analyzerMode: "static",
            generateStatsFile: true,
            openAnalyzer: false
        }));
    }

    return pluginsToAdd;
}

module.exports = {
    addPlugins,
    //overrideWebPackConfig
};

function getEntryObject(paths) {
    const result = {
        index: paths.appIndexJs
    };

    if (isExtnBuild) {
        result.background = resolvePath('src/common/background.js');
        result.menu = resolvePath('src/common/menu.js');
        result.jira_cs = resolvePath('src/content-scripts/jira.js');
    } else if (isPluginBuild) {
        result.index = resolvePath('src/index.plugin.js');
    }

    return result;
}

// No inner property should be modified directly in this method.
// Alternatively do deep clone instead
function getElectronConfig(config, target, entry) {
    config = { ...config, target, entry };
    config.output = { ...config.output, filename: '[name].js' };
    return config;
}

function getElectronMain(config) {
    return getElectronConfig(config, 'electron-main', {
        electron: resolvePath('src/electron/index.js')
    });
}

function getElectronRenderer(config) {
    return getElectronConfig(config, 'electron-renderer', {
        preload: resolvePath('src/electron/preload.js')
    });
}

// Util functions


function styleLoaderOptions(opt) {
    if (shouldUseSourceMap_CSS) {
        return opt;
    }

    if (opt.sourceMap) {
        opt.sourceMap = shouldUseSourceMap_CSS;
    } else if (opt.options?.sourceMap) {
        opt.options.sourceMap = shouldUseSourceMap_CSS;
    }

    return opt;
}

function getAliasPackages(packages) {
    Object.keys(packages).reduce((obj, key) => {
        let pack = packages[key];

        if (!Array.isArray(pack)) {
            pack = [pack];
        }

        for (let i = 0; i < pack.length; i++) {
            const srcPath = pack[i];

            if (fs.existsSync(srcPath)) {
                obj[key] = srcPath;
                return obj;
            }

            console.warn(`Package Key:- ${key}; "${srcPath}" not found. Please validate "aliases" in "package.json"`);
        }

        throw Error(`Dependency package not loaded. Package Key:- ${key}`);
    }, {});
}