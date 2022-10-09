const buildMode = process.env.REACT_APP_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isExtnBuild = !isWebBuild && !isAppBuild;

const isProdBuild = process.env.NODE_ENV === "production";
const isDevBuild = !isProdBuild;

const isQuickView = document.location.href.indexOf('?quick=true') > -1;

export { isWebBuild, isAppBuild, isExtnBuild, buildMode, isProdBuild, isDevBuild, isQuickView };
