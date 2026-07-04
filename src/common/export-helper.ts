import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';
import { exportCsv } from '../utils/helpers';

import Exporter, { ExportFormat } from './Exporter';

function isVisible(el: Element): boolean {
    return (el as HTMLElement).offsetParent !== null;
}

interface ChartCanvasInfo {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    title: string;
}

function getExportableCharts(root: Element): ChartCanvasInfo[] {
    const wrappers = Array.from(
        root.querySelectorAll<HTMLElement>('.exportable-image:not([data-no-export-image])'),
    );
    const result: ChartCanvasInfo[] = [];
    for (const wrapper of wrappers) {
        const canvas = wrapper.querySelector<HTMLCanvasElement>('canvas');
        if (!canvas) continue;
        const width = wrapper.offsetWidth || canvas.offsetWidth || canvas.width;
        const height = wrapper.offsetHeight || canvas.offsetHeight || canvas.height;
        const titleEl = wrapper.closest('[data-chart-title]');
        const title = titleEl?.getAttribute('data-chart-title') || '';
        result.push({ canvas, width, height, title });
    }
    return result;
}

function canvasToDataUrlWithBackground(canvas: HTMLCanvasElement, backgroundColor: string): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    return offscreen.toDataURL('image/png');
}

export class ExportHelper {
    element?: string | HTMLElement | Element;
    fileName?: string;
    format?: string;

    export(): void {
        if (this.format && this.format.toUpperCase() === 'XLSX') {
            this.exportToXlsx();
        } else if (this.format && this.format === ExportFormat.PDF) {
            this.exportToPDF();
        } else {
            this.exportToCsv();
        }
    }

    private getElement(): Element | null {
        if (!this.element) return null;
        if (typeof this.element === 'string') {
            return document.querySelector(this.element);
        }
        return this.element;
    }

    exportToXlsx(): void {
        const root = this.getElement();
        if (!root) return;

        const tables = Array.from(root.querySelectorAll<HTMLTableElement>('table.exportable'));
        if (tables.length === 0) return;

        const exporter = new Exporter();
        tables.forEach((tbl) => exporter.addTable(tbl));

        const charts = getExportableCharts(root);
        if (charts.length > 0) {
            exporter.addChartImages(charts.map((c) => ({ dataUrl: canvasToDataUrlWithBackground(c.canvas, '#ffffff'), width: c.width, height: c.height, title: c.title })));
        }

        exporter.export(this.fileName || 'download');
    }

    exportToCsv(): void {
        const root = this.getElement();
        if (!root) return;

        let table: HTMLTableElement | null = null;
        if (root instanceof HTMLTableElement && root.classList.contains('exportable')) {
            table = root;
        } else {
            table = root.querySelector<HTMLTableElement>('table.exportable');
        }

        if (!table) return;

        const sheetName = table.getAttribute('data-export-sheet-name') || this.fileName || 'download';
        this.exportTable(table, sheetName);
    }

    exportToPDF(): void {
        const root = this.getElement();
        if (!root) return;

        let table: HTMLTableElement | null = null;
        if (root instanceof HTMLTableElement && root.classList.contains('exportable')) {
            table = root;
        } else {
            table = root.querySelector<HTMLTableElement>('table.exportable');
        }

        if (!table) return;

        const fileName = table.getAttribute('data-export-sheet-name') || this.fileName || 'download';
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a3',
        });
        autoTable(doc, { html: table });

        const charts = getExportableCharts(root);
        if (charts.length > 0) {
            this.addChartsToPdf(doc, charts);
        }

        doc.save(`${fileName}.pdf`);
    }

    private addChartsToPdf(doc: jsPDF, charts: ChartCanvasInfo[]): void {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const maxWidth = pageWidth - margin * 2;

        doc.addPage();
        let currentY = margin;

        for (const { canvas, width, height } of charts) {
            const dataUrl = canvasToDataUrlWithBackground(canvas, '#ffffff');
            const ratio = Math.min(maxWidth / width, 1);
            const imgWidth = width * ratio;
            const imgHeight = height * ratio;

            if (currentY + imgHeight > pageHeight - margin) {
                doc.addPage();
                currentY = margin;
            }

            doc.addImage(dataUrl, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 16;
        }
    }

    exportTable(table: HTMLTableElement, fileName: string): void {
        const colInfo: Array<{ noExport?: boolean }> = [];

        const visibleTheadRows = Array.from(
            table.querySelectorAll<HTMLTableRowElement>('thead:not([data-export-ignore="true"]) tr:not([data-export-ignore="true"])'),
        ).filter((r) => isVisible(r));

        const visibleTbodyRows = Array.from(
            table.querySelectorAll<HTMLTableRowElement>('tbody tr:not([data-export-ignore="true"])'),
        ).filter((r) => isVisible(r));

        const content =
            genData(visibleTheadRows, colInfo) +
            genData(visibleTbodyRows, colInfo);

        exportCsv(content, fileName);

        function getVal(td: HTMLTableCellElement): string {
            const defaultOpts = { encode: true, trim: true };
            let opts = { ...defaultOpts };
            const optsAttr = td.getAttribute('data-export-option');
            if (optsAttr && optsAttr.length > 10) {
                try {
                    opts = { ...defaultOpts, ...JSON.parse(optsAttr) };
                } catch {
                    opts = defaultOpts;
                }
            }

            const child = td.querySelector<HTMLElement>('[data-export-data]');
            let val = String(
                td.getAttribute('data-export-data') ||
                (child && child.getAttribute('data-export-data')) ||
                (child && child.innerText) ||
                td.innerText ||
                '',
            ).replace(/\r?\n|\r/g, ' ');

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

        function genData(rows: HTMLTableRowElement[], colInfoArr: Array<{ noExport?: boolean }>): string {
            const header: string[][] = [];
            rows.forEach((r, i) => {
                const cells = Array.from(r.querySelectorAll<HTMLTableCellElement>(':scope > th, :scope > td'));
                cells.forEach((c, _origJ) => {
                    let j = 0;
                    // Find next available slot in this row (accounting for already-filled cells from colspan/rowspan)
                    if (!header[i]) {
                        header[i] = [];
                    }
                    j = _origJ;
                    // Skip already-filled slots (from previous rowspan)
                    while (header[i][j] !== null && header[i][j] !== undefined) {
                        j++;
                    }

                    const cellIsHidden = !isVisible(c);
                    if (!colInfoArr[j] || !colInfoArr[j].noExport) {
                        colInfoArr[j] = {
                            noExport: c.hasAttribute('data-no-export') || (cellIsHidden && !c.hasAttribute('data-force-export')),
                        };
                    }
                    header[i][j] = getVal(c);

                    let colspan = parseInt(c.getAttribute('colspan') || '1', 10);
                    while (colspan > 1) {
                        header[i][j + colspan - 1] = '';
                        colspan--;
                    }

                    let rowspan = parseInt(c.getAttribute('rowspan') || '1', 10);
                    while (rowspan > 1) {
                        if (!header[i + rowspan - 1]) {
                            header[i + rowspan - 1] = [];
                        }
                        header[i + rowspan - 1][j] = '';
                        rowspan--;
                    }
                });
            });

            let content = '';
            for (let r = 0; r < header.length; r++) {
                let rowC = '';
                const rowD = header[r];
                for (let c = 0; c < rowD.length; c++) {
                    if (colInfoArr[c]?.noExport) {
                        continue;
                    }
                    rowC += `,${rowD[c] || ''}`;
                }
                content += `${rowC.substring(1).replace(/\r?\n|\r/g, ' ')}\r\n`;
            }
            return content;
        }
    }
}
