import moment from 'moment';
import { getPathValue } from 'react-controls/common/utils';
import { btoa_encode } from './base64';

export { getPathValue };

export function saveAs(blob, fileName) {
    const reader = new FileReader();
    reader.onload = function (e) {
        saveStringAs(reader.result, blob.type, fileName);
    };
    reader.readAsBinaryString(blob);
}

export function saveStringAs(str, typeName, fileName) {
    const bdata = btoa_encode(str);
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

export function waitFor(ms) {
    if (ms > 0) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    return Promise.resolve(true);
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
    return Object.keys(params)
        .filter(p => params[p] !== undefined)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

export function getCurrentQueryParams() {
    const qryParams = document.location.search;

    if (qryParams) {
        return parseQueryParams(qryParams);
    }

    return {};
}

function parseQueryParams(qryParams) {
    const sp = new URLSearchParams(qryParams);
    return Array.from(sp.keys()).reduce((obj, k) => {
        obj[k] = sp.get(k);
        return obj;
    }, {});
}
/* This is commented on 18 Feb 2023 as no reference is found
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
}*/

export function getHostFromUrl(url) {
    if (url && typeof url !== "string") { url = url.toString(); }
    return url && new URL(url).host;
}

export function getOriginFromUrl(url) {
    if (url && typeof url !== "string") {
        url = url.toString();
    }

    let origin = new URL(url).origin;

    if (!origin || origin === 'null') {
        return;
    }

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
    if (userObj && typeof userObj === "object") {
        name = (userObj.name || userObj.emailAddress || userObj.accountId);
    }

    if (convertToLower && name) {
        name = name.toLowerCase();
    }
    return name;
}

export function parseHTML(html) {
    // ToDo: Parse HTML and return JSX with alternate option
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText;
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

export function calcCostPerSecs(secs, cost) { return ((secs / 60 / 60) * cost) || null; }

export function convertToDate(value) {
    if (!value) {
        return value;
    }
    if (value instanceof Date) {
        return value;
    }
    else if (typeof value === "string" && value.indexOf("/Date(") > -1) { return new Date(parseInt(value.replace("/Date(", "").replace(")/", ""), 10)); }
    else {
        const dateObj = moment(value);
        if (dateObj.isValid()) {
            return dateObj.toDate();
        }
    }
}

export function mergeUrl(root, url) {
    if (!url || (url.startsWith('http') && url.indexOf(':') > 3)) {
        return url;
    }
    if (!url.startsWith('/')) {
        url = `/${url}`;
    }

    return root?.clearEnd('/') + url;
}

export function viewIssueUrl(root, key) {
    if (!root || !key) {
        return;
    }

    return mergeUrl(root, `/browse/${key}`);
}

export function stop(e) {
    e.stopPropagation();
    e.preventDefault();
}

export function replaceRepeatedWords(names) {
    const total = names.length;
    if (total === 0) { return []; }

    // Separate first two and last one characters, and middle part
    const separated = names.map(name => {
        if (name.length <= 3) {
            // If the name is too short, no replacement
            return { start: name, middle: '', end: '' };
        }
        return {
            start: name.slice(0, 2),
            middle: name.slice(2, -1),
            end: name.slice(-1)
        };
    });

    // Split the middle parts into tokens
    const middleTokens = separated.map(parts => parts.middle.split(' '));

    // Find the maximum number of tokens in the middle parts
    const maxTokens = middleTokens.reduce((max, tokens) => Math.max(max, tokens.length), 0);

    // Initialize an array to hold token counts for each position
    const tokenCounts = Array.from({ length: maxTokens }, () => ({}));

    // Count occurrences of each token in each position
    for (let i = 0; i < maxTokens; i++) {
        for (let j = 0; j < total; j++) {
            const tokens = middleTokens[j];
            if (i < tokens.length) {
                const token = tokens[i];
                // Ignore tokens with numbers and those with length <= 3
                if (!/\d/.test(token) && token.length > 3) {
                    tokenCounts[i][token] = (tokenCounts[i][token] || 0) + 1;
                }
            }
        }
    }

    // Determine which token positions should be replaced
    const positionsToReplace = new Set();
    for (let i = 0; i < maxTokens; i++) {
        for (const [token, count] of Object.entries(tokenCounts[i])) {
            if (count / total >= 0.5) {
                positionsToReplace.add(i);
                break; // Replace if any token in this position meets the criteria
            }
        }
    }

    // Replace the tokens in the middle parts
    const processedMiddle = middleTokens.map(tokens => tokens.map((token, idx) => {
        if (positionsToReplace.has(idx) && token.length > 3 && !/\d/.test(token)) {
            return '...';
        }
        return token;
    }).join(' ')
    );

    // Reconstruct the full strings ensuring first two and last one characters are intact
    const replacedNames = separated.map((parts, idx) => {
        const middle = processedMiddle[idx];
        // Handle cases where middle is empty
        if (middle === '') {
            return parts.start + parts.end;
        }
        return (parts.start + middle + parts.end).replace(/([.]+\s*){3,}/g, '...').replace(/([.]+\s*){2}/g, '...');
    });

    return replacedNames;
}