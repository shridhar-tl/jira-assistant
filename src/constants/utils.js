import * as moment from 'moment';
import { GITHUB_HOME_URL } from './urls';

export function getDateRange(rangeOf) {
    const ranges = [
        [moment().startOf('month').toDate(), moment().endOf('month').toDate()],
        [moment().subtract(1, 'months').toDate(), moment().toDate()],
        [moment().subtract(1, 'months').startOf('month').toDate(), moment().subtract(1, 'months').endOf('month').toDate()],
        [moment().startOf('week').toDate(), moment().endOf('week').toDate()],
        [moment().subtract(6, 'days').toDate(), moment().toDate()],
        [moment().subtract(1, 'weeks').startOf('week').toDate(), moment().subtract(1, 'weeks').endOf('week').toDate()]
    ];
    if (rangeOf) {
        return ranges[rangeOf - 1];
    }
    else {
        return ranges;
    }
}

export const UUID = (function () {
    const self = {};
    const lut = [];
    for (let i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    self.generate = function () {
        const d0 = Math.random() * 0xffffffff | 0;
        const d1 = Math.random() * 0xffffffff | 0;
        const d2 = Math.random() * 0xffffffff | 0;
        const d3 = Math.random() * 0xffffffff | 0;
        // eslint-disable-next-line max-len
        return `${lut[d0 & 0xff] + lut[(d0 >> 8) & 0xff] + lut[(d0 >> 16) & 0xff] + lut[(d0 >> 24) & 0xff]}-${lut[d1 & 0xff]}${lut[(d1 >> 8) & 0xff]}-${lut[((d1 >> 16) & 0x0f) | 0x40]}${lut[(d1 >> 24) & 0xff]}-${lut[(d2 & 0x3f) | 0x80]}${lut[(d2 >> 8) & 0xff]}-${lut[(d2 >> 16) & 0xff]}${lut[(d2 >> 24) & 0xff]
            }${lut[d3 & 0xff]}${lut[(d3 >> 8) & 0xff]}${lut[(d3 >> 16) & 0xff]}${lut[(d3 >> 24) & 0xff]}`;
    };
    return self;
})();

export function getGitHubIssueUrl(issueId) { return `${GITHUB_HOME_URL}/issues/${issueId}`; }