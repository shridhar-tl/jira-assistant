export default class DataTransformService {
    static dependencies = ["UtilsService"];

    constructor($utils) {
        this.$utils = $utils;
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
        if (prop)
            {return arr.sum((v) => { return v[prop]; });}
        else
            {return arr.sum();}
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
        if (prop)
            {return arr.Max((v) => { return v[prop]; });}
        else
            {return arr.Max();}
    }
    bytes(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
            {return '-';}
        if (typeof precision === 'undefined') {
            precision = 1;
        }
        const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'], number = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)  } ${  units[number]}`;
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
        if (!value || max === -1)
            {return value;}
        max = parseInt(max || 20, 10);
        if (!max)
            {return value;}
        if (value.length <= max)
            {return value;}
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
            return `${prefix + (h > 0 ? h.pad(2) : "00")  }:${  m > 0 ? m.pad(2) : "00"}`;
        }
        else {
            return prefix + ((h > 0 ? `${h  }h ` : "") + (m > 0 ? `${m  }m ` : "") + (s > 0 ? `${s  }s` : "")).trim();
        }
    }
    formatTs(d, simple) {
        return this.formatSecs(this.$utils.getTotalSecs(d), false, simple);
    }
    formatUser(obj, fields) {
        if (!obj) {
            return null;
        }
        switch (fields) {
            case "EM": return obj.emailAddress;
            case "LG": return obj.name;
            case "NE": return `${obj.displayName  }(${  obj.emailAddress  })`;
            case "NL": return `${obj.displayName  }(${  obj.name  })`;
            default: return obj.displayName;
        }
    }
    propOfNthItem(arr, index, prop, fromCsv) {
        if (!arr)
            {return null;}
        if (!Array.isArray(arr))
            {return "#Error:Array expected";}
        if (!arr.length)
            {return null;}
        if (typeof index === "string" && isNaN(Number(index))) {
            if (index === "last")
                {index = arr.length - 1;}
        }
        index = Number(index);
        if (!isNaN(index)) {
            index = index - 0;
            if (index < 0)
                {return "#Error:Out of L Bound";}
            if (index >= arr.length)
                {return "#Error:Out of U Bound";}
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
        if (!prop)
            {return object;}
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
                    if (data !== "<null>")
                        {obj[val[0]] = data;}
                }
                return obj;
            }
            else
                {return obj;}
        }
    }
}
