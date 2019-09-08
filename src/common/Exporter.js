/* eslint-disable eqeqeq */
/* eslint-disable complexity */
import * as $ from 'jquery';
//import Excel from "exceljs/dist/es5/exceljs.browser";
//Working:import * as Excel from "exceljs/dist/exceljs.min.js";
import Excel from "exceljs/modern.browser";
//https://github.com/guyonroche/exceljs/issues/511#issuecomment-391140701
//import { saveAs } from 'file-saver';

export default class Exporter {
    constructor(format) {
        const doc = new Excel.Workbook();
        doc.created = new Date();
        doc.creator = "Jira Assistant";
        doc.lastModifiedBy = "Jira Assistant";
        this.document = doc;
    }

    addTable(table) {
        table = $(table);
        console.log('Exporting ', table.attr('exportSheetName'));
        this.worksheet = this.document.addWorksheet(table.attr('exportSheetName'));
        this.sheetOptions = {
            mergeCells: [],
            width: {},
            styles: [],
            rowsToRemove: [],
            rowsToHide: []
        };
        this.curRowNum = 1;
        //const sheetOptions = {};
        const headerRows = table.find("> thead:not([exportIgnore]) > tr:not([exportIgnore])");
        //let headerRows = head.find("tr");
        this.prepareData(headerRows);
        console.log("header rows", headerRows.length);
        const bodyRows = table.find("> tbody:not([exportIgnore]) > tr:not([exportIgnore])");
        this.prepareData(bodyRows); //body.find("tr"));
        console.log("bodyRows rows", bodyRows.length);
        this.worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRows.length }]; //, topLeftCell: 'G10', activeCell: 'A1'

        this.sheetOptions.mergeCells.forEach(cols => this.worksheet.mergeCells(cols));
        const widths = this.sheetOptions.width;
        const cols = Object.keys(widths);
        cols.forEach(col => {
            const xlCol = this.worksheet.getColumn(col);
            const w = parseFloat(widths[col]) / 7.178;
            xlCol.width = w;
        });
        this.sheetOptions.styles.forEach(obj => {
            const cell = this.worksheet.getCell(obj.key);
            const htmlStyle = obj.style;
            const alignment = {};
            if (htmlStyle.textAlign !== "left") {
                alignment.horizontal = htmlStyle.textAlign;
            }
            if (htmlStyle.verticalAlign !== "left") {
                alignment.vertical = htmlStyle.verticalAlign;
            }
            cell.alignment = alignment;
            const fweight = htmlStyle.fontWeight || '';
            cell.style.font = { size: this.getFontSize(htmlStyle.fontSize), bold: fweight.indexOf('bold') > -1 || fweight >= 550 };
            //let bgColor = this.rgbaToHex(htmlStyle.backgroundColor);
            //let fontColor = this.rgbaToHex(htmlStyle.color);
            //if ((bgColor || fontColor) && (!bgColor.startsWith('000000') || !fontColor.startsWith('000000'))) {
            //  let fillColor: any = {
            //    type: 'pattern',
            //    pattern: 'solid'
            //  };
            //  fillColor.fgColor = { argb: fontColor.startsWith('000000') ? '000000FF' : fontColor };
            //  fillColor.bgColor = { argb: bgColor.startsWith('000000') ? 'FFFFFFFF' : bgColor };
            //  console.log(obj.key, fillColor);
            //  cell.fill = fillColor;
            //}
        });
        this.sheetOptions.rowsToHide.forEach(row => this.worksheet.getRow(row).hidden = true);
        this.sheetOptions.rowsToRemove.orderByDescending().forEach(row => this.worksheet.spliceRows(row, 1));
        this.worksheet = null;
        this.sheetOptions = null;
        this.curRowNum = null;
    }

    //rgb2hex(rgb) {
    //  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    //  return (rgb) ? ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
    //    ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
    //    ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
    //}

    trim(str) {
        return str.replace(/^\s+|\s+$/gm, '');
    }

    getFontSize(size) {
        if (!size) {
            return size;
        }
        if (size.endsWith('px')) {
            return parseInt(size.replace('px', ''), 10) * .75;
        }
        if (size.endsWith('pt')) {
            return parseInt(size.replace('pt', ''), 10);
        }
        if (size.endsWith('em')) {
            return parseInt(size.replace('em', ''), 10) * 0.0833333;
        }
    }

    rgbaToHex(rgba) {
        if (!rgba) {
            return rgba;
        }
        const parts = rgba.substring(rgba.indexOf("(")).split(","), r = parseInt(this.trim(parts[0].substring(1)), 10), g = parseInt(this.trim(parts[1]), 10), b = parseInt(this.trim(parts[2]), 10);
        parts[3] = parts[3] || '1)';
        const a = parseFloat(this.trim(parts[3].substring(0, parts[3].length - 1))).toFixed(2);
        return (this.fixSize(r.toString(16)) + this.fixSize(g.toString(16)) + this.fixSize(b.toString(16)) + this.fixSize((a * 255).toString(16).substring(0, 2)));
    }

    fixSize(val) { return (val.length === 1) ? `0${val}` : val; }

    prepareData(rows) {
        const worksheet = this.worksheet;
        const rowSpanInfo = [];
        rows.each((rowIdx, row) => {
            row = $(row);
            const dataArr = this.getColArray(row, rowSpanInfo);
            if (dataArr) {
                const xlRow = worksheet.addRow(dataArr);
                xlRow.commit();
                this.curRowNum++;
            }
        });
    }

    getColArray(row, rowSpanInfo) {
        const cols = row.find("> th, > td");
        const dataArr = [];
        const exportIgnore = !!row.attr("exportIgnore");
        if (exportIgnore) {
            this.sheetOptions.rowsToRemove.push(this.curRowNum);
        }
        if (row.attr("exportHidden")) {
            this.sheetOptions.rowsToHide.push(this.curRowNum);
        }
        cols.each((colIdx, col) => {
            while (rowSpanInfo[dataArr.length] > 0) {
                rowSpanInfo[dataArr.length] = rowSpanInfo[dataArr.length] - 1;
                dataArr[dataArr.length] = null;
            }
            col = $(col);
            let value = col.attr('exportValue');
            if (!value) {
                value = col.text();
            }
            if (value && !exportIgnore) {
                value = value.trim();
            }
            if (value && !exportIgnore) {
                const exportType = col.attr('exportType');
                switch (exportType) {
                    case 'int':
                        value = parseInt(value, 10);
                        break;
                    case 'float':
                        value = parseFloat(value);
                        break;
                    case 'number':
                        value = Number(value);
                        break;
                    default: break;
                }
            }
            dataArr[dataArr.length] = value;
            let colspan = col.attr('colspan') || 1;
            const rowspan = (col.attr('rowspan') || 1) - 1;
            if (rowspan) {
                rowSpanInfo[dataArr.length - 1] = rowspan;
            }
            const startChar = this.numToChar(dataArr.length);
            const startRow = this.curRowNum;
            if (colspan > 1 || rowspan > 0) {
                const endChar = this.numToChar(dataArr.length + (colspan - 1));
                const endRow = this.curRowNum + rowspan;
                this.sheetOptions.mergeCells.push(`${startChar + startRow}:${endChar}${endRow}`);
            }
            if (!exportIgnore) {
                if (!colspan || colspan < 2) {
                    const w = col.width();
                    if (w > 20) {
                        this.sheetOptions.width[startChar] = w;
                    }
                    //else if (col.get(0).style.width) { console.log("style width", col.get(0).style.width); } // ToDo: need implementation
                }
                this.sheetOptions.styles.push({ key: startChar + startRow, style: window.getComputedStyle(col.get(0), null) });
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

    export(fileName) {
        //this.document.xlsx.writeFile(fileName);
        this.document.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: "application/octet-stream" });
            saveAs(blob, `${fileName}.xlsx`);
        });
    }

    charToNum(alpha) {
        //let index = 0;
        for (let i = 0, j = 1; i < j; i++ , j++) {
            if (alpha == this.numToChar(i)) {
                //index = i;
                j = i;
            }
        }
    }

    numToChar(number) {
        const numeric = (number - 1) % 26;
        const letter = this.chr(65 + numeric);
        const temp = (number - 1) / 26;
        const number2 = parseInt(temp, 10);
        if (number2 > 0) {
            return this.numToChar(number2) + letter;
        }
        else {
            return letter;
        }
    }

    chr(codePt) {
        if (codePt > 0xFFFF) {
            codePt -= 0x10000;
            return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
        }
        return String.fromCharCode(codePt);
    }
}

export const ExportFormat = {
    XLSX: "XLSX",
    CSV: "CSV"
};

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
