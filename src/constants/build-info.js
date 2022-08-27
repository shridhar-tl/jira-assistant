const buildMode = process.env.REACT_APP_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isExtnBuild = !isWebBuild && !isAppBuild;

const isProdBuild = process.env.NODE_ENV === "production";
const isDevBuild = !isProdBuild;

export { isWebBuild, isAppBuild, isExtnBuild, buildMode, isProdBuild, isDevBuild };
