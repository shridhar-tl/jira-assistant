export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function parseTime(text) {
    const [h, m] = text.split(':').map((v) => parseInt(v, 10));
    return h * HOUR + m * MINUTE;
}

export function roundTo(value, step) {
    return Math.round(value / step) * step;
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function randomTime(rng, [from, to]) {
    const start = parseTime(from);
    const end = parseTime(to);
    return roundTo(start + rng.next() * (end - start), MINUTE);
}

/*
 * All planner times are "wall" milliseconds: the local wall clock of the configured utcOffset expressed as if it were UTC.
 */
export function createClock(utcOffset, nowOverride) {
    const match = utcOffset.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid utcOffset "${utcOffset}". Expected format +HH:MM`);
    }
    const offsetMs = (match[1] === '-' ? -1 : 1) * (parseInt(match[2], 10) * HOUR + parseInt(match[3], 10) * MINUTE);
    const compact = utcOffset.replace(':', '');
    const nowInstant = nowOverride ? Date.parse(nowOverride) : Date.now();
    const wallIso = (wall) => new Date(wall).toISOString().slice(0, 19);

    return {
        nowWall: nowInstant + offsetMs,
        startOfDay: (wall) => wall - (((wall % DAY) + DAY) % DAY),
        weekday: (wall) => new Date(wall).getUTCDay(),
        isWeekend: (wall) => [0, 6].includes(new Date(wall).getUTCDay()),
        parseDate: (text) => Date.parse(`${text}T00:00:00.000Z`),
        dateText: (wall) => wallIso(wall).slice(0, 10),
        sprintFormat: (wall) => `${wallIso(wall)}.000${utcOffset}`,
        worklogFormat: (wall) => `${wallIso(wall)}.000${compact}`,
        display: (wall) => wallIso(wall).replace('T', ' ').slice(0, 16),
    };
}
