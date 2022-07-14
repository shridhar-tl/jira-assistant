export function clone(value) {
    if (!value) { return value; }

    else if (Array.isArray(value)) {
        return value.map(clone);
    } else if (value instanceof Date) {
        return new Date(value.getTime());
    } else if (typeof (value) === 'object') {
        return { ...value };
    }

    return value;
}

export function formatDataForDisplay(data) {
    if (!data) { return data; }

    if (data instanceof Date) {
        data.toString();
    }

    return data;
}

export function stop(e) {
    e.stopPropagation();
    e.preventDefault();
}