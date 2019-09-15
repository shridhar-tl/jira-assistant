
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

const hourColanParser = /^(\d*?):(\d*)$/;
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
        if (value.indexOf(".")) {
            const parts = value.split(".");
            hours = parseInt(parts[0]) || 0;
            minutes = parseInt(parts[1]) || 0;
        }
        else {
            minutes = parseInt(value) || 0;
        }
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
