export function clone<T>(value: T): T {
    if (!value) {
        return value;
    } else if (Array.isArray(value)) {
        return value.map(clone) as T;
    } else if (value instanceof Date) {
        return new Date(value.getTime()) as T;
    } else if (typeof value === 'object') {
        return { ...value };
    }

    return value;
}

export function formatDataForDisplay(data: any): any {
    if (!data) {
        return data;
    }

    if (data instanceof Date) {
        data.toString();
    }

    return data;
}
