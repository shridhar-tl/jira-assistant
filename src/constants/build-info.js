const buildMode = process.env.REACT_APP_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isExtnBuild = !isWebBuild && !isAppBuild;

export { isWebBuild, isAppBuild, isExtnBuild, buildMode };
