
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