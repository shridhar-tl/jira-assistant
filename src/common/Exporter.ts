import * as Excel from 'exceljs';

import { saveAs } from '../utils/helpers';

interface ChartImageInfo {
    dataUrl: string;
    width: number;
    height: number;
    title: string;
}

export default class Exporter {
    document: Excel.Workbook;
    worksheet: Excel.Worksheet | null;
    sheetOptions: {
        mergeCells: string[];
        width: Record<string, number>;
        styles: Array<{ key: string; style: CSSStyleDeclaration }>;
        rowsToRemove: number[];
        rowsToHide: number[];
    } | null;
    curRowNum: number;

    constructor() {
        const doc = new Excel.Workbook();
        doc.created = new Date();
        doc.creator = 'Jira Assistant';
        doc.lastModifiedBy = 'Jira Assistant';
        this.document = doc;
        this.worksheet = null;
        this.sheetOptions = null;
        this.curRowNum = 1;
    }

    addTable(table: HTMLTableElement) {
        const sheetName = this.normalizeSheetName(table.getAttribute('data-export-sheet-name') || '');
        console.log('Exporting ', sheetName);
        this.worksheet = this.document.addWorksheet(sheetName);
        this.sheetOptions = {
            mergeCells: [],
            width: {},
            styles: [],
            rowsToRemove: [],
            rowsToHide: [],
        };
        this.curRowNum = 1;

        const headerRows = Array.from(
            table.querySelectorAll<HTMLTableRowElement>(':scope > thead:not([data-export-ignore="true"]) > tr:not([data-export-ignore="true"])'),
        );
        this.prepareData(headerRows);
        console.log('header rows', headerRows.length);

        const bodyRows = Array.from(
            table.querySelectorAll<HTMLTableRowElement>(':scope > tbody:not([data-export-ignore="true"]) > tr:not([data-export-ignore="true"])'),
        );
        this.prepareData(bodyRows);
        console.log('bodyRows rows', bodyRows.length);

        this.worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRows.length }];

        this.sheetOptions.mergeCells.forEach((cols) => (this.worksheet as Excel.Worksheet).mergeCells(cols));

        const widths = this.sheetOptions.width;
        Object.keys(widths).forEach((col) => {
            const xlCol = (this.worksheet as Excel.Worksheet).getColumn(col);
            const w = widths[col] / 7.178;
            xlCol.width = w;
        });

        this.sheetOptions.styles.forEach((obj) => {
            const cell = (this.worksheet as Excel.Worksheet).getCell(obj.key);
            const htmlStyle = obj.style;
            const alignment: Partial<Excel.Alignment> = {};
            if (htmlStyle.textAlign !== 'left') {
                alignment.horizontal = htmlStyle.textAlign as Excel.Alignment['horizontal'];
            }
            if (htmlStyle.verticalAlign !== 'left') {
                alignment.vertical = htmlStyle.verticalAlign as Excel.Alignment['vertical'];
            }
            cell.alignment = alignment;
            const fweight = htmlStyle.fontWeight || '';
            cell.style.font = {
                size: this.getFontSize(htmlStyle.fontSize),
                bold: fweight.indexOf('bold') > -1 || Number(fweight) >= 550,
            };
        });

        this.sheetOptions.rowsToHide.forEach((row) => ((this.worksheet as Excel.Worksheet).getRow(row).hidden = true));
        this.sheetOptions.rowsToRemove
            .sort((a, b) => b - a)
            .forEach((row) => (this.worksheet as Excel.Worksheet).spliceRows(row, 1));

        this.worksheet = null;
        this.sheetOptions = null;
    }

    normalizeSheetName(name: string) {
        if (!name) {
            return name;
        }
        return name
            .replace(/\[/g, '(')
            .replace(/\]/g, ')')
            .replace(/:/g, '-')
            .replace(/[?/\\]/g, '');
    }

    trim(str: string) {
        return str.replace(/^\s+|\s+$/gm, '');
    }

    getFontSize(size: string): number | undefined {
        if (!size) {
            return undefined;
        }
        if (size.endsWith('px')) {
            return parseInt(size.replace('px', ''), 10) * 0.75;
        }
        if (size.endsWith('pt')) {
            return parseInt(size.replace('pt', ''), 10);
        }
        if (size.endsWith('em')) {
            return parseInt(size.replace('em', ''), 10) * 0.0833333;
        }
        return undefined;
    }

    rgbaToHex(rgba: string) {
        if (!rgba) {
            return rgba;
        }
        const parts = rgba.substring(rgba.indexOf('(')).split(','),
            r = parseInt(this.trim(parts[0].substring(1)), 10),
            g = parseInt(this.trim(parts[1]), 10),
            b = parseInt(this.trim(parts[2]), 10);
        parts[3] = parts[3] || '1)';
        const a = parseFloat(parseFloat(this.trim(parts[3].substring(0, parts[3].length - 1))).toFixed(2));
        return (
            this.fixSize(r.toString(16)) +
            this.fixSize(g.toString(16)) +
            this.fixSize(b.toString(16)) +
            this.fixSize((a * 255).toString(16).substring(0, 2))
        );
    }

    fixSize(val: string) {
        return val.length === 1 ? `0${val}` : val;
    }

    prepareData(rows: HTMLTableRowElement[]) {
        const rowSpanInfo: number[] = [];
        rows.forEach((row) => {
            const dataArr = this.getColArray(row, rowSpanInfo);
            if (dataArr) {
                const xlRow = (this.worksheet as Excel.Worksheet).addRow(dataArr);
                xlRow.commit();
                this.curRowNum++;
            }
        });
    }

    getColArray(row: HTMLTableRowElement, rowSpanInfo: number[]): (string | number | Date | null)[] | null {
        const cols = Array.from(row.querySelectorAll<HTMLTableCellElement>(':scope > th, :scope > td'));
        const dataArr: (string | number | Date | null)[] = [];
        const exportIgnore = row.getAttribute('data-export-ignore') === 'true';

        if (exportIgnore) {
            this.sheetOptions!.rowsToRemove.push(this.curRowNum);
        }
        if (row.hasAttribute('data-export-hidden')) {
            this.sheetOptions!.rowsToHide.push(this.curRowNum);
        }

        cols.forEach((col) => {
            while (rowSpanInfo[dataArr.length] > 0) {
                rowSpanInfo[dataArr.length] = rowSpanInfo[dataArr.length] - 1;
                dataArr[dataArr.length] = null;
            }

            let value: string | number | Date | null = col.getAttribute('data-export-value') || col.innerText || '';

            if (value && !exportIgnore) {
                value = (value as string).trim();
                const exportType = col.getAttribute('data-export-type');
                switch (exportType) {
                    case 'int':
                        value = toInt(value as string);
                        break;
                    case 'float':
                    case 'number':
                        value = toFloat(value as string);
                        break;
                    case 'date':
                        value = toDate(value as string, true);
                        break;
                    case 'datetime':
                        value = toDate(value as string, false);
                        break;
                    default:
                        break;
                }
            }

            dataArr[dataArr.length] = value;

            let colspan = parseInt(col.getAttribute('colspan') || '1', 10);
            const rowspan = (parseInt(col.getAttribute('rowspan') || '1', 10)) - 1;

            if (rowspan) {
                rowSpanInfo[dataArr.length - 1] = rowspan;
            }

            const startChar = this.numToChar(dataArr.length);
            const startRow = this.curRowNum;

            if (colspan > 1 || rowspan > 0) {
                const endChar = this.numToChar(dataArr.length + (colspan - 1));
                const endRow = this.curRowNum + rowspan;
                this.sheetOptions!.mergeCells.push(`${startChar + startRow}:${endChar}${endRow}`);
            }

            if (!exportIgnore) {
                if (!colspan || colspan < 2) {
                    const w = col.clientWidth;
                    if (w > 20) {
                        this.sheetOptions!.width[startChar] = w;
                    }
                }
                this.sheetOptions!.styles.push({ key: startChar + startRow, style: window.getComputedStyle(col, null) });
            }

            while (colspan > 1) {
                colspan = colspan - 1;
                dataArr[dataArr.length] = null;
                if (rowspan) {
                    rowSpanInfo[dataArr.length - 1] = rowspan;
                }
            }
        });

        return dataArr;
    }

    addChartImages(charts: ChartImageInfo[]): void {
        if (!charts.length) return;

        const sheet = this.document.addWorksheet('Charts');

        // ExcelJS ImagePosition: tl is a 0-based fractional col/row anchor,
        // ext.width/height are in pixels — ExcelJS converts to EMU internally.
        const colWidthPx = 600;
        const paddingRows = 1;
        // Excel default row height is 20px (15pt). We force all rows to this height
        // so the fractional row coordinate maps predictably to pixels.
        const pxPerRow = 20;

        // Set column A wide enough so all charts fit within it
        sheet.getColumn(1).width = colWidthPx / 7.5;

        let currentRow = paddingRows;

        for (const { dataUrl, width, height, title } of charts) {
            const scale = Math.min(colWidthPx / width, 1);
            const imgWidth = Math.round(width * scale);
            const imgHeight = Math.round(height * scale);
            const rowsNeeded = Math.ceil(imgHeight / pxPerRow);

            if (title) {
                sheet.getRow(currentRow + 1).height = pxPerRow;
                sheet.getCell(currentRow + 1, 1).value = title;
                currentRow += 1;
            }

            // Ensure rows behind the image have the expected height
            for (let r = 0; r < rowsNeeded; r++) {
                sheet.getRow(currentRow + 1 + r).height = pxPerRow;
            }

            const imageId = this.document.addImage({
                base64: dataUrl,
                extension: 'png',
            });

            sheet.addImage(imageId, {
                tl: { col: 0, row: currentRow },
                ext: { width: imgWidth, height: imgHeight },
                editAs: 'absolute',
            });

            currentRow += rowsNeeded + paddingRows;
        }
    }

    export(fileName: string) {
        this.document.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/octet-stream' });
            saveAs(blob, `${fileName}.xlsx`);
        });
    }

    numToChar(number: number): string {
        const numeric = (number - 1) % 26;
        const letter = String.fromCharCode(65 + numeric);
        const number2 = Math.floor((number - 1) / 26);
        if (number2 > 0) {
            return this.numToChar(number2) + letter;
        } else {
            return letter;
        }
    }
}

export const ExportFormat = {
    XLSX: 'XLSX',
    CSV: 'CSV',
    PDF: 'PDF',
};

function toInt(value: string): number | string {
    if (!value) {
        return value;
    }
    const val = parseInt(value, 10);
    return isNaN(val) ? value : val;
}

function toFloat(value: string): number | string {
    if (!value) {
        return value;
    }
    const val = parseFloat(value);
    return isNaN(val) ? value : val;
}

function toDate(value: string, _onlyDate: boolean): Date | string {
    if (!value) {
        return value;
    }
    const val = new Date(value);
    return isNaN(val.getTime()) ? value : val;
}
