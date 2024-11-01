const fs = require('fs-extra');
const path = require('path');
const paths = require('react-scripts/config/paths');
process.env.NODE_ENV = 'production';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (...relativePath) => path.resolve(appDirectory, ...relativePath);
const resolveBuildPath = (...relativePath) => path.resolve(paths.appBuild, ...relativePath);
//const resolvePath = relativePath => path.resolve(paths.appBuild, relativePath);

const browsersList = ["chrome", "edge", "opera", "firefox", "firefox_selfhost"];

const buildMode = process.env.VITE_BUILD_MODE || process.env.REACT_APP_BUILD_MODE;
console.log(`Build mode set to: ${buildMode}`);

if (buildMode === 'WEB') {
    cleanupForWebApp(false);
    cleanupBrowserFolders();
    fs.copyFileSync(resolveBuildPath('index.html'), resolveBuildPath('404.html'));
} else if (buildMode === 'APP') {
    cleanupForWebApp(false);
    cleanupBrowserFolders();
    const { name, version, description, author, bugs, build } = require('./package.json');

    build.extraMetadata.main = './electron.js';
    delete build.files;

    const scripts = {
        postinstall: 'electron-builder install-app-deps'
    };

    fs.writeJsonSync(resolveApp('build/package.json'), {
        name, version, description,
        homepage: './', author, bugs, build,
        scripts, main: './electron.js'
    });

    const appBuildActionFile = `.github/workflows/build-app.yml`;
    const sourceActionPath = resolveApp(appBuildActionFile);

    if (fs.existsSync(sourceActionPath)) {
        fs.mkdirSync(resolveBuildPath('.github'));
        fs.mkdirSync(resolveBuildPath('.github', 'workflows'));
        fs.copyFileSync(sourceActionPath, resolveBuildPath(appBuildActionFile));
    }
} else if (buildMode === 'PLUGIN') {
    cleanupForPlugin(false);
    cleanupBrowserFolders();
} else {
    movePackages(paths.appBuild);
}

function movePackages(buildPath, printLogs) {
    const excludedFolders = ["source_map"];

    const filesOnRoot = fs.readdirSync(buildPath).filter(f => browsersList.indexOf(f.toLowerCase()) === -1 && excludedFolders.indexOf(f.toLowerCase()) === -1);

    const allFilesList = [];
    getFiles(buildPath, allFilesList);

    deleteUnnecessaryFiles(allFilesList);

    moveSourceMapFiles(allFilesList, printLogs);

    browsersList.forEach((browser, i) => {
        const copyFile = i < browsersList.length - 1;
        const isFirefox = browser.includes('firefox');

        filesOnRoot.forEach(file => {
            const src = `${buildPath}/${file}`;
            const targ = `${buildPath}/${browser}/${file}`;

            // Except for firefox, do not copy content.js to any browsers
            if (!isFirefox && file === 'content.js') {
                return;
            }

            if (copyFile) {
                if (printLogs) {
                    console.log(`Copying ${src} to ${targ}`);
                }
                fs.copySync(src, targ);
            } else {
                if (printLogs) {
                    console.log(`Moving ${src} to ${targ}`);
                }
                fs.moveSync(src, targ);
            }
        });
    });
}

function moveSourceMapFiles(allFilesList, printLogs) {
    // Move all the sourcemap files to different folder
    const sourcemapFileTypes = /[.]map$/;

    let sourceMapPath = resolveApp('source_map');
    if (!sourceMapPath.endsWith('/')) {
        sourceMapPath = `${sourceMapPath}/`;
    }

    const sourcemapFilesList = allFilesList.filter(f => sourcemapFileTypes.test(f));

    if (!sourcemapFilesList.length) {
        return;
    }

    if (!fs.existsSync(sourceMapPath)) {
        if (sourcemapFilesList.length) {
            fs.mkdirSync(sourceMapPath);
        }
    } else {
        const oldSourcemapFiles = [];
        getFiles(sourceMapPath, oldSourcemapFiles);
        oldSourcemapFiles
            .filter(f => f.endsWith('.map'))
            .forEach(f => {
                if (printLogs) {
                    console.log(`Deleting old sourcemap file ${f}`);
                }
                fs.unlinkSync(f);
            });
    }

    sourcemapFilesList.forEach(f => {
        if (printLogs) {
            console.log(`Moving '${f}' to ${sourceMapPath + path.basename(f)}`);
        }
        fs.moveSync(f, sourceMapPath + path.basename(f));
    });
}

function getFiles(path, files) {
    fs.readdirSync(path).forEach(function (file) {
        const subpath = `${path}/${file}`;
        if (fs.lstatSync(subpath).isDirectory()) {
            getFiles(subpath, files);
        } else {
            files.push(`${path}/${file}`);
        }
    });
}

function deleteUnnecessaryFiles(allFilesList, printLogs) {
    const deleteFileTypes = /([.]txt|[.]svg)$/;
    // Delete all the txt and svg files which are unnecessary
    deleteAllFiles(allFilesList.filter(f => deleteFileTypes.test(f)), printLogs);
}

function deleteAllFiles(filesList, printLogs) {
    filesList.forEach(f => {
        if (printLogs) {
            console.log(`Deleting file ${f}`);
        }
        fs.unlinkSync(f);
    });
}

function cleanupForWebApp(printLogs) {
    console.log("Post build cleanup action for webapp");
    const allFilesList = [];
    getFiles(paths.appBuild, allFilesList);

    deleteUnnecessaryFiles(allFilesList, printLogs);
}

function cleanupForPlugin(printLogs) {
    cleanupForWebApp(printLogs);

    fs.unlinkSync(resolveBuildPath('favicon.ico'));

    // Cleanup assets folder
    fs.emptyDirSync(resolveBuildPath('assets'));
    fs.rmdirSync(resolveBuildPath('assets'));
}

function cleanupBrowserFolders() {
    browsersList.forEach(folder => {
        folder = resolveBuildPath(folder);
        fs.emptyDirSync(folder);
        fs.rmdirSync(folder);
    });

    fs.unlinkSync(resolveBuildPath('content.js'));
    fs.unlinkSync(resolveBuildPath('api-pollyfill.js'));
    fs.unlinkSync(resolveBuildPath('menu.html'));
}