const buildMode = process.env.REACT_APP_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isPluginBuild = buildMode === 'PLUGIN';
const isExtnBuild = !isWebBuild && !isAppBuild && !isPluginBuild;

const isProdBuild = process.env.NODE_ENV === "production";
const isDevBuild = !isProdBuild;

function redirectToRoute(route) {
    document.location.href = getRouteUrl(route);
}

function getRouteUrl(route) {
    const webRoute = (isWebBuild || isPluginBuild);
    route = route || '/';
    if (!webRoute && route === '/') {
        route = '';
    }

    return webRoute ? route : (`/index.html${route ? '#' : ''}${route}`);
}

export { isWebBuild, isAppBuild, isExtnBuild, isPluginBuild, buildMode, isProdBuild, isDevBuild, redirectToRoute, getRouteUrl };
