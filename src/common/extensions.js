/* eslint-disable no-extend-native */

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 2)) { s = `0${s}`; }
    return s;
};

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'Febraury', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TINY_DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Date.prototype.isBetween = function (fromDate, toDate) {
    if (typeof fromDate !== 'number') {
        fromDate = new Date(fromDate).getTime();
    }
    if (typeof toDate !== 'number') {
        toDate = new Date(toDate).getTime();
    }
    const curDate = this.getTime();

    return fromDate <= curDate && curDate <= toDate;
};

Date.prototype.format = function (seperat) {
    const yyyy = this.getFullYear();
    const mm = this.getMonth() < 9 ? `0${this.getMonth() + 1}` : (this.getMonth() + 1); // getMonth() is zero-based
    const dd = this.getDate() < 10 ? `0${this.getDate()}` : this.getDate();
    const hh = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
    const min = this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
    const ss = this.getSeconds() < 10 ? `0${this.getSeconds()}` : this.getSeconds();


    if (seperat) {
        return seperat
            .replace("yyyy", yyyy)
            .replace("yy", yyyy)
            .replace("MMMM", FULL_MONTH_NAMES[mm - 1])
            .replace("MMM", SHORT_MONTH_NAMES[mm - 1])
            .replace("MM", mm)
            //.replace("M", mm - 0) // This cause issue in the month of march as M in march is replaced
            .replace("DDDD", FULL_DAY_NAMES[this.getDay()])
            .replace("DDD", SHORT_DAY_NAMES[this.getDay()])
            .replace("dddd", FULL_DAY_NAMES[this.getDay()])
            .replace("ddd", SHORT_DAY_NAMES[this.getDay()])
            .replace("DD", TINY_DAY_NAMES[this.getDay()])
            .replace("dd", dd)
            //.replace("d", dd - 0) // For safety this was also removed
            .replace("HH", hh)
            .replace("H", hh - 0)
            .replace("hh", hh > 12 ? (hh - 12).pad(2) : hh)
            //.replace("h", hh > 12 ? hh - 12 : hh) // This also cause issue
            .replace("mm", min)
            .replace("ss", ss)
            .replace("tt", hh >= 12 ? "PM" : "AM")
            //.replace("t", hh >= 12 ? "P" : "A")
            ;
    }
    else {
        return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);
    }
};

Date.prototype.toUTCDate = function () {
    const newObj = new Date(this.getTime());
    newObj.setMinutes(newObj.getMinutes() + this.getTimezoneOffset());
    return newObj;
};

Date.prototype.addDays = function (days) {
    const dat = new Date(this);
    dat.setDate(dat.getDate() + days);
    return dat;
};

String.prototype.format = function (args) {
    if (args && !Array.isArray(args)) { args = [args]; }
    let str = this;
    for (let i = 0; i < args.length; i++) {
        str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i]);
    }
    return str;
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str) {
        return this.toLowerCase().indexOf(str.toLowerCase()) === 0;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (str) {
        return this.toLowerCase().lastIndexOf(str.toLowerCase()) === this.length - str.length;
    };
}

if (!String.prototype.trimEnd) {
    String.prototype.trimEnd = function (str) {
        let s = this;
        while (s.endsWith(str)) {
            s = s.substring(0, s.length - str.length);
        }
        return s;
    };
}

if (!String.prototype.trimStart) {
    String.prototype.trimStart = function (str) {
        let s = this;
        while (s.startsWith(str)) {
            s = s.substring(str.length);
        }
        return s;
    };
}
