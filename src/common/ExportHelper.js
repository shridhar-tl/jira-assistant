/* eslint-disable no-eq-null */
import * as $ from 'jquery';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Exporter, { ExportFormat } from './Exporter';
import { exportCsv } from './utils';

export class ExportHelper {

    export() {
        if (this.format && this.format.toUpperCase() === "XLSX") {
            this.exportToXlsx();
        }
        else if (this.format && this.format === ExportFormat.PDF) {
            this.exportToPDF();
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

    exportToPDF() {
        const el = $(this.element).find('table.exportable:first-child');
        const fileName = el.attr("export-sheet-name") || this.fileName || 'download';
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: "a3"
        });
        doc.autoTable({ html: el.get(0) });
        doc.save(`${fileName}.pdf`);
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

        exportCsv(content, fileName);

        function getVal(td) {
            const defaultOpts = { encode: true, trim: true };
            let opts = td.attr("export-option");
            if (opts && opts.length > 10) {
                opts = { ...defaultOpts, ...JSON.parse(opts) };
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
                    while (rowarr[j] !== null && rowarr[j] !== undefined) {
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
                    if (colInfo[c]?.noExport) { continue; }
                    rowC += `,${rowD[c] || ""}`;
                }
                content += `${rowC.substring(1).replace(/\r?\n|\r/g, " ")}\r\n`;
            }
            return content;
        }
    }
}
