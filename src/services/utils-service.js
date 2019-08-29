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
        if (format)
            {return format
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
                .replace("tt", hhInt >= 12 ? "PM" : "AM");}
        else
            {return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);}
    }

    getRowStatus(d) {
        let classNames = "";
        if (d.status) {
            classNames += (d.status.name || d.status).toLowerCase() === "closed" ? "closed " : "";
        }
        if (d.difference) {
            const secsDiff = this.getTotalSecs(d.difference);
            if (secsDiff > 0)
                {classNames += "log-high ";}
            else if (secsDiff < 0)
                {classNames += "log-less ";}
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
            if (num.length > 2)
                {secs += parseInt(num[2], 0);}
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
        else if (typeof value === "string" && value.indexOf("/Date(") > -1)
            {return new Date(parseInt(value.replace("/Date(", "").replace(")/", ""), 10));}
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
}
