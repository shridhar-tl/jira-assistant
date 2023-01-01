import moment from 'moment';

export function prepareDateRange(dateRange) {
    // eslint-disable-next-line prefer-const
    let { fromDate, toDate, ...others } = dateRange;
    if (typeof fromDate === 'string') {
        fromDate = moment(fromDate).toDate();
    }
    if (typeof toDate === 'string') {
        toDate = moment(toDate).toDate();
    }

    return { fromDate, toDate, ...others };
}


export function getRandomColor() {
    const bg = Math.floor(Math.random() * 16777215).toString(16);
    return `#${bg}`;
}