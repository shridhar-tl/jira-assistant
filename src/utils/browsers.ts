declare const opr: any;
declare const chrome: any;
declare const InstallTrigger: any;

const userAgent = navigator.userAgent.toLowerCase();

const isOpera = (typeof opr !== 'undefined' && !!opr.addons) || navigator.userAgent.indexOf(' OPR/') >= 0;

const isFirefox = typeof InstallTrigger !== 'undefined' || (userAgent.indexOf('firefox') > 0 && userAgent.indexOf('chrome') === -1);

const isChrome = !isFirefox && typeof chrome !== 'undefined' && (!!chrome.webstore || !!chrome.runtime);

const isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;

const isEdge = isEdgeChromium;

const browser = {
    isChrome,
    isFirefox,
    isEdge,
    isOpera,
};

export default browser;

export const BROWSER_NAME = getName();

function getName(): string {
    if (isEdge || isEdgeChromium) {
        return 'edge';
    } else if (isFirefox) {
        return 'firefox';
    } else if (isChrome) {
        return 'chrome';
    } else if (isOpera) {
        return 'opera';
    } else {
        return 'chrome';
    }
}
