const fs = require('fs-extra');
const path = require('path');
const paths = require('react-scripts/config/paths');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
//const resolvePath = relativePath => path.resolve(paths.appBuild, relativePath);

const browsersList = ["chrome", "edge", "opera", "firefox", "firefox_selfhost"];

const sourceMapPath = resolveApp('source_map');

if (process.env.REACT_APP_BUILD_MODE === 'WEB') {
    cleanupForWebApp(false);
} else if (process.env.REACT_APP_BUILD_MODE === 'APP') {
    // Nothing for now
} else {
    movePackages(paths.appBuild, sourceMapPath);
}

function movePackages(buildPath, sourceMapPath, printLogs) {
    const excludedFolders = ["source_map"];

    const filesOnRoot = fs.readdirSync(buildPath).filter(f => browsersList.indexOf(f.toLowerCase()) === -1 && excludedFolders.indexOf(f.toLowerCase()) === -1);

    const allFilesList = [];
    getFiles(buildPath, allFilesList);

    deleteUnnecessaryFiles(allFilesList);

    // Move all the sourcemap files to different folder
    const sourcemapFileTypes = /[.]map$/;

    if (!sourceMapPath.endsWith('/')) {
        sourceMapPath = `${sourceMapPath}/`;
    }

    const sourcemapFilesList = allFilesList.filter(f => sourcemapFileTypes.test(f));

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
    allFilesList
        .filter(f => deleteFileTypes.test(f))
        .forEach(f => {
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