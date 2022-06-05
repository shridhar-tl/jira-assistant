import moment from 'moment';
import $ from 'jquery';

export function saveAs(blob, fileName) {
    const reader = new FileReader();
    reader.onload = function (e) {
        saveStringAs(reader.result, blob.type, fileName);
    };
    reader.readAsBinaryString(blob);
}

export function saveStringAs(str, typeName, fileName) {
    const bdata = btoa(str);
    const datauri = `data:${typeName};base64,${bdata}`;
    const a = document.createElement('a');
    if ('download' in a) { //html5 A[download]
        a.href = datauri;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        setTimeout(function () {
            a.click();
            document.body.removeChild(a);
        }, 66);
    }
    else {
        document.location.href = datauri;
    }
}

/**
* Export the given content to CSV file.
*
* @constructor
*
* @param {string} content
*   The content to be exported.
* @param {string} fileName
*   The name of the file to be exported.
* @param {string} mimeType
*   (optional) The mime type of the file to be exported.
*/
export function exportCsv(content, fileName, mimeType) {
    const a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    const ind = fileName.toLowerCase().lastIndexOf(".csv");
    if (ind === -1 || ind === fileName.length - 4) { fileName += ".csv"; }
    if (navigator.msSaveBlob) { // IE10
        return navigator.msSaveBlob(new Blob([content], { type: mimeType }), fileName);
    }
    else if ('download' in a) { //html5 A[download]
        a.href = `data:${mimeType},${encodeURIComponent(content)}`;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        setTimeout(function () {
            a.click();
            document.body.removeChild(a);
        }, 66);
        return true;
    }
    else { //do iframe dataURL download (old ch+FF):
        const f = document.createElement('iframe');
        document.body.appendChild(f);
        f.src = `data:${mimeType},${encodeURIComponent(content)}`;
        setTimeout(function () { document.body.removeChild(f); }, 333);
        return true;
    }
}

const hourColanParser = /^\d{1,3}:([0-5]\d?|60?)$/;
const displayFormatParser = /^( *(?<w>\d{1,})w)?( *(?<d>\d{1,})d)?( *(?<h>\d{1,})h)?( *(?<m>\d{1,})m)?$/;

export function parseTimespent(value) {
    if (!value) { return 0; }
    let week = 0, days = 0, hours = 0, minutes = 0;

    if (typeof value !== "string" && typeof value !== "number") { return null; }

    value = value.toString();
    value = value.trim();

    const hoursPerDay = 8;
    const daysPerWeek = 5;

    if (!isNaN(value)) {
        minutes = Math.round(parseFloat(value) * 60);
    }
    else if (hourColanParser.test(value)) {
        const parts = value.split(":");
        hours = parseInt(parts[0]) || 0;
        minutes = parseInt(parts[1]) || 0;
    }
    else if (displayFormatParser.test(value)) {
        const { w, d, h, m } = displayFormatParser.exec(value).groups;
        week = parseInt(w) || 0;
        days = parseInt(d) || 0;
        hours = parseInt(h) || 0;
        minutes = parseInt(m) || 0;
    }

    return ((((((week * daysPerWeek) + days) * hoursPerDay) + hours) * 60) + minutes) * 60;
}

export function prepareUrlWithQueryString(url, params) {
    params = encodeAsQuerystring(params);
    return `${(url || "").clearEnd("?")}${params ? "?" : ""}${params}`;
}

export function encodeAsQuerystring(params) {
    return Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

export function parseJwt(token) {
    try {
        // Get Token Header
        const base64HeaderUrl = token.split('.')[0];
        const base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
        const headerData = JSON.parse(window.atob(base64Header));

        // Get Token payload and date's
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const dataJWT = JSON.parse(window.atob(base64));
        dataJWT.header = headerData;

        return dataJWT;
    } catch (err) {
        return false;
    }
}

export function getHostFromUrl(url) {
    if (url && typeof url !== "string") { url = url.toString(); }
    return url && new URL(url).host;
}

export function getOriginFromUrl(url) {
    if (url && typeof url !== "string") { url = url.toString(); }
    let origin = new URL(url).origin;
    if (!origin.endsWith("/")) {
        origin += "/";
    }
    return origin;
}

export function setStartOfWeek(startOfWeek) {
    if (!startOfWeek || startOfWeek < 1) { startOfWeek = 1; }
    moment.locale(moment.locale(), { week: { dow: startOfWeek - 1 } });
}

export function getUserName(userObj, convertToLower) {
    let name = null;
    if (typeof userObj === "object") {
        name = (userObj.name || userObj.emailAddress || userObj.accountId);
    }

    if (convertToLower && name) {
        name = name.toLowerCase();
    }
    return name;
}

export function parseHTML(html) {
    return $(`<div>${html}</div>`).text(); // ToDo: Parse HTML and return JSX with alternate option
}

export function getPathValue(obj, path) {
    if (!path || !obj) { return obj; }

    let value = obj[path];
    if (!value) {
        const paths = path.split(".");
        if (paths.length > 1) {
            value = paths.reduce((val, path) => (val || undefined) && val[path], obj);
        }
    }

    return value;
}

export function parseJiraCustomCSV(obj) {
    obj = obj.replace(/(^.*\[|\].*$)/g, '');
    const vals = obj.split(',');
    obj = {};

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i].split('=');
        const data = val[1];
        if (data !== "<null>") { obj[val[0]] = data; }
    }

    return obj;
}

export function calcCostPerSecs(secs, cost) { return (secs / 60 / 60) * cost; }