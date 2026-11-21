const fs = require('fs');
const path = require('path');
process.env.NODE_ENV = 'production';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (...relativePath) => path.resolve(appDirectory, ...relativePath);
const BUILD_DIR = resolveApp('dist'); // Vite uses 'dist' instead of 'build'
const resolveBuildPath = (...relativePath) => path.resolve(BUILD_DIR, ...relativePath);

const browsersList = ['chrome', 'edge', 'opera', 'firefox', 'firefox_selfhost'];

// Files at the dist root that are extension-only and should not ship with web/app/plugin builds.
const extensionOnlyRootFiles = ['api-pollyfill.js', 'content.js', 'menu.html', 'background.js', 'jira_cs.js', 'jira_cs.css'];

// Files at the dist root that are hosted only by the web build (e.g. the video help relay player framed by extension and app builds).
const webOnlyRootFiles = ['video-player.html'];

const buildMode = process.env.VITE_BUILD_MODE;
console.log(`Build mode set to: ${buildMode}`);

if (buildMode === 'WEB') {
    cleanupForWebApp(false);
    cleanupBrowserFolders();
    fs.copyFileSync(resolveBuildPath('index.html'), resolveBuildPath('404.html'));
} else if (buildMode === 'APP') {
    cleanupForWebApp(false);
    cleanupBrowserFolders();
    cleanupWebOnlyFiles();
    const { name, version, description, author, bugs, build } = require('./package.json');

    if (build) {
        build.extraMetadata = build.extraMetadata || {};
        build.extraMetadata.main = './electron.js';
        delete build.files;
    }

    const scripts = {
        postinstall: 'electron-builder install-app-deps',
    };

    const appPackageJson = {
        name,
        version,
        description,
        homepage: './',
        author,
        bugs,
        build,
        scripts,
        main: './electron.js',
    };
    fs.writeFileSync(resolveBuildPath('package.json'), `${JSON.stringify(appPackageJson)}
`);

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
    cleanupWebOnlyFiles();
} else {
    cleanupWebOnlyFiles();
    movePackages(BUILD_DIR);
}

function movePackages(buildPath, printLogs) {
    const excludedFolders = ['source_map'];

    // Files & folders at the dist root that should be distributed into each browser folder.
    // We skip the browser folders themselves (they already exist with their manifest.json
    // copied from public/) and the source_map folder.
    const filesOnRoot = fs
        .readdirSync(buildPath)
        .filter((f) => browsersList.indexOf(f.toLowerCase()) === -1 && excludedFolders.indexOf(f.toLowerCase()) === -1);

    const allFilesList = [];
    getFiles(buildPath, allFilesList);

    deleteUnnecessaryFiles(allFilesList);

    moveSourceMapFiles(allFilesList, printLogs);

    browsersList.forEach((browser, i) => {
        const copyFile = i < browsersList.length - 1;
        const isFirefox = browser.includes('firefox');

        filesOnRoot.forEach((file) => {
            const src = `${buildPath}/${file}`;
            const targ = `${buildPath}/${browser}/${file}`;

            // Only firefox uses the classic content_scripts injection via content.js.
            // Chromium-based browsers inject jira_cs.js directly through web_accessible_resources.
            if (!isFirefox && file === 'content.js') {
                return;
            }

            if (copyFile) {
                if (printLogs) {
                    console.log(`Copying ${src} to ${targ}`);
                }
                fs.cpSync(src, targ, { recursive: true, force: true });
            } else {
                if (printLogs) {
                    console.log(`Moving ${src} to ${targ}`);
                }
                // Moving will fail if target already exists (e.g. manifest.json that was
                // copied from public/<browser>/), so remove the target first.
                moveSync(src, targ, true);
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

    const sourcemapFilesList = allFilesList.filter((f) => sourcemapFileTypes.test(f));

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
            .filter((f) => f.endsWith('.map'))
            .forEach((f) => {
                if (printLogs) {
                    console.log(`Deleting old sourcemap file ${f}`);
                }
                fs.unlinkSync(f);
            });
    }

    sourcemapFilesList.forEach((f) => {
        if (printLogs) {
            console.log(`Moving '${f}' to ${sourceMapPath + path.basename(f)}`);
        }
        moveSync(f, sourceMapPath + path.basename(f));
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
    deleteAllFiles(
        allFilesList.filter((f) => deleteFileTypes.test(f)),
        printLogs,
    );
}

function deleteAllFiles(filesList, printLogs) {
    filesList.forEach((f) => {
        if (printLogs) {
            console.log(`Deleting file ${f}`);
        }
        fs.unlinkSync(f);
    });
}

function cleanupForWebApp(printLogs) {
    console.log('Post build cleanup action for webapp');
    const allFilesList = [];
    getFiles(BUILD_DIR, allFilesList);

    deleteUnnecessaryFiles(allFilesList, printLogs);
}

function cleanupForPlugin(printLogs) {
    cleanupForWebApp(printLogs);

    safeUnlink(resolveBuildPath('favicon.ico'));

    // The old (CRA) build emitted JS/CSS into static/ and only icons/images into assets/, so
    // assets/ could be safely wiped for the plugin. Vite emits *all* JS/CSS into assets/, so
    // we only prune the icon images that Forge doesn't need (Forge serves its own iconography).
    const assetsDir = resolveBuildPath('assets');
    if (fs.existsSync(assetsDir)) {
        fs.readdirSync(assetsDir).forEach((file) => {
            if (/^(icon_|donate)/i.test(file)) {
                safeUnlink(path.join(assetsDir, file));
            }
        });
    }
}

function cleanupBrowserFolders() {
    // Remove per-browser folders (copied from public/ for non-extension builds where they're not needed)
    browsersList.forEach((folder) => {
        const folderPath = resolveBuildPath(folder);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
    });

    // Remove extension-only root files that may have been copied from public/ or produced by the build
    extensionOnlyRootFiles.forEach((file) => {
        safeUnlink(resolveBuildPath(file));
    });
}

function cleanupWebOnlyFiles() {
    webOnlyRootFiles.forEach((file) => {
        safeUnlink(resolveBuildPath(file));
    });
}

function moveSync(src, targ, overwrite) {
    if (overwrite) {
        fs.rmSync(targ, { recursive: true, force: true });
    }

    try {
        fs.renameSync(src, targ);
    } catch (err) {
        // Windows can transiently lock a freshly copied folder (EPERM/EACCES/EBUSY), and rename can't cross devices (EXDEV).
        if (!['EXDEV', 'EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
            throw err;
        }
        fs.cpSync(src, targ, { recursive: true, force: overwrite });
        fs.rmSync(src, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
}

function safeUnlink(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.warn(`Failed to remove ${filePath}: ${err.message}`);
    }
}
