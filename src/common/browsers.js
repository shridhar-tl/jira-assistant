// Opera 8.0+
const isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
const isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]" 
//const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
const isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
const isEdge = !isIE && !!window.StyleMedia;

// Chrome 1 - 71
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime) && !isFirefox;

// Blink engine detection
//const isBlink = (isChrome || isOpera) && !!window.CSS;

export default {
    isChrome, isFirefox, isEdge, isOpera //, isSafari, isBlink
};

export const BROWSER_NAME = getName();

function getName() {
    if (isChrome) {
        return "chrome";
    }
    else if (isFirefox) {
        return "firefox";
    }
    else if (isEdge) {
        return "edge";
    }
    else if (isOpera) {
        return "opera";
    }
}