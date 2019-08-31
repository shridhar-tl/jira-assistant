import * as moment from 'moment';
import { SHORT_MONTH_NAMES, FULL_MONTH_NAMES, TINY_DAY_NAMES, SHORT_DAY_NAMES, FULL_DAY_NAMES } from '../_constants';

export default class UtilsService {
    formatDate(date, format) {
        const yyyy = date.getFullYear().toString();
        const mmInt = date.getMonth();
        const mm = mmInt < 9 ? `0${mmInt + 1}` : (mmInt + 1).toString(); // getMonth() is zero-based
        const dd = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate().toString();
        const hhInt = date.getHours();
        const hh = hhInt < 10 ? `0${hhInt}` : hhInt.toString();
        const min = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes().toString();
        const ss = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds().toString();
        const day = date.getDay();
        if (format) {
            return format
                .replace("yyyy", yyyy)
                .replace("yy", yyyy)
                .replace("MMMM", FULL_MONTH_NAMES[mmInt])
                .replace("MMM", SHORT_MONTH_NAMES[mmInt])
                .replace("MM", mm)
                .replace("DDDD", FULL_DAY_NAMES[day])
                .replace("DDD", SHORT_DAY_NAMES[day])
                .replace("dddd", FULL_DAY_NAMES[day])
                .replace("ddd", SHORT_DAY_NAMES[day])
                .replace("DD", TINY_DAY_NAMES[day])
                .replace("dd", dd)
                .replace("HH", hh)
                .replace("hh", (hhInt > 12 ? (hhInt - 12) : hh).toString())
                .replace("mm", min)
                .replace("ss", ss)
                .replace("tt", hhInt >= 12 ? "PM" : "AM");
        }
        else { return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss); }
    }

    getRowStatus(d) {
        let classNames = "";
        if (d.status) {
            classNames += (d.status.name || d.status).toLowerCase() === "closed" ? "closed " : "";
        }
        if (d.difference) {
            const secsDiff = this.getTotalSecs(d.difference);
            if (secsDiff > 0) { classNames += "log-high "; }
            else if (secsDiff < 0) { classNames += "log-less "; }
        }
        return classNames;
    }

    //ToDo:
    //loadModal(url, scope) {
    //  const div = $('<div id="divRemoteModal" class="modal fade" role="dialog"></div>');
    //  $("#divRemoteModal").remove();
    //  $("body > div.page-container").append(div);
    //}

    // ToDo: Tour need to be fixed
    //loadTour(name, settings) {
    //  if (!name) {
    //    name = obj.currentPage;
    //    settings = obj.pageSettings;
    //  }
    //  if (settings) {
    //    const items = tourData[name];
    //    if (items && items.length > 0) {
    //      bootstro.start('', { items: items });
    //    }
    //  }
    //}

    getTotalSecs(ts) {
        if (typeof ts === "string") {
            let num = null;
            if (!ts || (num = ts.split(':')).length < 2) {
                return ts;
            }
            let secs = parseInt(num[0], 0) * 60 * 60;
            secs += parseInt(num[1], 0) * 60;
            if (num.length > 2) { secs += parseInt(num[2], 0); }
            return secs;
        }
        else if (typeof ts === "number") {
            return ts / 1000;
        }
    }

    //ToDo: Modal closed event
    //modalClosed() {
    //  $('body').removeClass("modal-open").removeAttr("style"); // This is a fix for Model Service.
    //  $('.modal-backdrop').remove(); // This is fix for modal backdrop not hiding
    //}

    convertDate(value) {
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

    getDateArray(startDate, endDate) {
        const retVal = [];
        let current = new Date(startDate);
        while (current <= endDate) {
            retVal.push(new Date(current));
            current = current.addDays(1);
        }
        return retVal;
    }


    yesno(val) {
        if (val === true) {
            return "Yes";
        }
        else if (val === false) {
            return "Yes";
        }
        else {
            return val;
        }
    }

    avg(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.Avg((v) => v[prop]);
        }
        else {
            return arr.Avg();
        }
    }

    sum(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) { return arr.sum((v) => { return v[prop]; }); }
        else { return arr.sum(); }
    }

    min(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.Min((v) => { return v[prop]; });
        }
        else {
            return arr.Min();
        }
    }
    max(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) { return arr.Max((v) => { return v[prop]; }); }
        else { return arr.Max(); }
    }
    bytes(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) { return '-'; }
        if (typeof precision === 'undefined') {
            precision = 1;
        }
        const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'], number = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)} ${units[number]}`;
    }
    convertSecs(d, opts) {
        if (!opts) {
            opts = {};
        }
        if (!d) {
            return opts.showZeroSecs ? 0 : "";
        }
        else if (Array.isArray(d)) {
            d = d.sum();
        }
        d = Number(d);
        if (opts.format) {
            return this.formatSecs(d, opts.showZeroSecs);
        }
        else {
            return parseFloat(((d / 3600).toFixed(4)));
        }
    }
    count(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.count((v) => v[prop]);
        }
        else {
            return arr.count();
        }
    }
    cut(value, max, wordwise, tail) {
        if (!value || max === -1) { return value; }
        max = parseInt(max || 20, 10);
        if (!max) { return value; }
        if (value.length <= max) { return value; }
        value = value.substr(0, max);
        if (wordwise) {
            let lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so it gives a cleaner result.
                if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }
        return value + (tail || '...'); //$('<span>&hellip;</span>').text() // ToDo: need to find alternate approach
    }
    formatSecs(d, showZeroSecs, simple) {
        if (d === 0) {
            return showZeroSecs ? "0s" : "";
        }
        if (d && Array.isArray(d)) {
            d = d.sum();
        }
        d = Number(d);
        let prefix = "";
        if (d < 0) {
            prefix = "-";
            d = Math.abs(d);
        }
        const h = Math.floor(d / 3600);
        const m = Math.floor(d % 3600 / 60);
        const s = Math.floor(d % 3600 % 60);
        if (simple) {
            return `${prefix + (h > 0 ? h.pad(2) : "00")}:${m > 0 ? m.pad(2) : "00"}`;
        }
        else {
            return prefix + ((h > 0 ? `${h}h ` : "") + (m > 0 ? `${m}m ` : "") + (s > 0 ? `${s}s` : "")).trim();
        }
    }
    formatTs(d, simple) {
        return this.formatSecs(this.getTotalSecs(d), false, simple);
    }
    formatUser(obj, fields) {
        if (!obj) {
            return null;
        }
        switch (fields) {
            case "EM": return obj.emailAddress;
            case "LG": return obj.name;
            case "NE": return `${obj.displayName}(${obj.emailAddress})`;
            case "NL": return `${obj.displayName}(${obj.name})`;
            default: return obj.displayName;
        }
    }
    propOfNthItem(arr, index, prop, fromCsv) {
        if (!arr) { return null; }
        if (!Array.isArray(arr)) { return "#Error:Array expected"; }
        if (!arr.length) { return null; }
        if (typeof index === "string" && isNaN(Number(index))) {
            if (index === "last") { index = arr.length - 1; }
        }
        index = Number(index);
        if (!isNaN(index)) {
            index = index - 0;
            if (index < 0) { return "#Error:Out of L Bound"; }
            if (index >= arr.length) { return "#Error:Out of U Bound"; }
        }
        return this.getProperty(arr[index], prop, fromCsv);
    }
    getProperty(object, prop, fromCsv) {
        if (!object) {
            return object;
        }
        if (fromCsv && typeof object === "string") {
            object = this.convertCustObj(object);
        }
        if (!prop) { return object; }
        return object[prop];
    }
    convertCustObj(obj) {
        let i;
        if (Array.isArray(obj)) {
            const arr = [];
            for (i = 0; i < obj.length; i++) {
                arr[i] = this.convertCustObj(obj[i]);
            }
            return arr;
        }
        else {
            if (typeof obj === "string") {
                obj = obj.replace(/(^.*\[|\].*$)/g, '');
                const vals = obj.split(',');
                obj = {};
                for (i = 0; i < vals.length; i++) {
                    const val = vals[i].split('=');
                    const data = val[1];
                    if (data !== "<null>") { obj[val[0]] = data; }
                }
                return obj;
            }
            else { return obj; }
        }
    }
}
