/* global chrome opr */
const userAgent = navigator.userAgent.toLowerCase();

// Opera 8.0+
const isOpera = (typeof opr !== 'undefined' && !!opr.addons) /*|| (typeof opera !== 'undefined')*/ || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
const isFirefox = typeof InstallTrigger !== 'undefined' || (userAgent.indexOf("firefox") > 0 && userAgent.indexOf("chrome") === -1);

// Safari 3.0+ "[object HTMLElementConstructor]" 
//const isSafari = /constructor/i.test(HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(typeof safari === 'undefined' || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
//const isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
//const isEdge = !isIE && typeof StyleMedia !== 'undefined';

// Chrome 1 - 103
const isChrome = !isFirefox && (typeof chrome !== 'undefined' && (!!chrome.webstore || !!chrome.runtime));

// Edge (based on chromium) detection
const isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") !== -1);

const isEdge = isEdgeChromium;

// Blink engine detection
//const isBlink = (isChrome || isOpera) && !!window.CSS;

const browser = {
    isChrome, isFirefox, isEdge, isOpera //, isSafari, isBlink
};

export default browser;

export const BROWSER_NAME = getName();

function getName() {
    if (isEdge || isEdgeChromium) { return "edge"; }
    else if (isFirefox) { return "firefox"; }
    else if (isChrome) { return "chrome"; }
    else if (isOpera) { return "opera"; }
    //else if (isSafari) { return "safari"; }
    else { return "chrome"; }
}