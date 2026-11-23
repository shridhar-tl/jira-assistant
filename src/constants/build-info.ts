const buildMode = import.meta.env.VITE_BUILD_MODE;
const isWebBuild = buildMode === 'WEB';
const isAppBuild = buildMode === 'APP';
const isPluginBuild = buildMode === 'PLUGIN';
const isExtnBuild = !isWebBuild && !isAppBuild && !isPluginBuild;

const isProdBuild = import.meta.env.PROD;
const isDevBuild = !isProdBuild;
const isQuickView = globalThis.location?.href.includes('?quick=true') ?? false;

export const appVersionNo = '3.0.6';

export function redirectToRoute(route?: string): void {
    document.location.href = getRouteUrl(route);
}

export function getRouteUrl(route?: string): string {
    route = route || '/';
    if (!isWebBuild && route === '/') {
        route = '';
    }

    return isWebBuild ? route : `${isPluginBuild ? '' : '/index.html'}${route ? '#' : ''}${route}`;
}

export { buildMode, isAppBuild, isDevBuild, isExtnBuild, isPluginBuild, isProdBuild, isQuickView, isWebBuild };
