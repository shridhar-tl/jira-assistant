/* eslint-disable no-eq-null */
import * as $ from 'jquery';
import Exporter, { ExportFormat } from './Exporter';

export class ExportHelper {

    export() {
        if (this.format && this.format.toUpperCase() === "XLSX") {
            this.exportToXlsx();
        }
        else {
            this.exportToCsv();
        }
    }

    exportToXlsx() {
        const el = $(this.element);
        const exporter = new Exporter(ExportFormat.XLSX);
        el.find('table.exportable').each((idx, tbl) => exporter.addTable(tbl));
        exporter.export(this.fileName);
    }

    exportToCsv() {
        let el = $(this.element);

        if (!el.is("table")) {
            el = el.find("table.exportable");
        }

        this.exportTable(el, el.attr("export-sheet-name") || this.fileName || 'download');
    }
    /**
    * Export the table.
    *
    * @constructor
    *
    * @param {string} id
    *   The id of the table to be exported.
    * @param {string} fileName
    *   The name of the file to be exported.
    */
    exportTable(id, fileName) {
        const colInfo = [];
        let content = null;

        if (typeof id === "string") {
            content = genData($(`#${id} thead:not([no-export]) tr:not([no-export]):visible`), colInfo)
                + genData($(`#${id} tbody:visible tr:not([no-export]):visible`), colInfo);
        }
        else {
            content = genData(id.find("thead:not([no-export]) tr:not([no-export]):visible"), colInfo)
                + genData(id.find("tbody:visible tr:not([no-export]):visible"), colInfo);
        }

        this.exportCsv(content, fileName);

        function getVal(td) {
            const defaultOpts = { encode: true, trim: true };
            let opts = td.attr("export-option");
            if (opts && opts.length > 10) {
                opts = $.extend(defaultOpts, JSON.parse(opts));
            }
            else {
                opts = defaultOpts;
            }

            const child = td.find("[export-data]:first");
            let val = (td.attr("export-data") || child.attr("export-data") || child.text() || td.text()).replace(/\r?\n|\r/g, " ");

            if (opts.trim) {
                val = val.trim();
            }

            if (val.indexOf('"') >= 0) {
                val = val.replace(/"/g, '""');
            }

            if (opts.encode && val.indexOf(',') >= 0) {
                val = `"${val}"`;
            }

            return val;
        }
        function genData(node, colInfo) {
            const header = [];
            node.each((i, r) => {
                $(r).children("th,td").each((j, c) => {
                    c = $(c);
                    let rowarr = header[i];
                    if (!rowarr) {
                        rowarr = header[i] = [];
                    }
                    while (rowarr[j] != null) {
                        j++;
                    }
                    const info = colInfo[j];
                    if (!info || !info.noExport) { colInfo[j] = { noExport: c.is("[no-export]") || (c.is(":hidden") && !c.is("[force-export]")) }; }
                    rowarr[j] = getVal(c);
                    let colspan = parseInt(c.attr("colspan"));
                    while (colspan > 1) {
                        rowarr[j + colspan - 1] = "";
                        colspan--;
                    }
                    let rowspan = parseInt(c.attr("rowspan"));
                    while (rowspan > 1) {
                        let nRow = header[i + rowspan - 1];
                        if (!nRow) { nRow = header[i + rowspan - 1] = []; }
                        nRow[j] = "";
                        rowspan--;
                    }
                });
            });
            let content = "";
            for (let r = 0; r < header.length; r++) {
                let rowC = "";
                const rowD = header[r];
                for (let c = 0; c < rowD.length; c++) {
                    if (colInfo[c].noExport) { continue; }
                    rowC += `,${rowD[c] || ""}`;
                }
                content += `${rowC.substring(1).replace(/\r?\n|\r/g, " ")}\r\n`;
            }
            return content;
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
    exportCsv(content, fileName, mimeType) {
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
}
