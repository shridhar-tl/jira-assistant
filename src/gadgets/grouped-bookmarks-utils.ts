export interface GroupedRow {
    ticketNo: string;
    group: string;
    [key: string]: any;
}

export interface SortState {
    sortBy: string;
    isDesc: boolean;
}

export interface GroupOption {
    value: string;
    label: string;
}

/** Filter value standing for "no group"; an empty string is easily taken for "nothing selected" */
export const NoGroup = '__no-group__';

/** Case-insensitive and number-aware, so "ABC-9" sorts before "ABC-10" */
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function compareRows(a: GroupedRow, b: GroupedRow, { sortBy, isDesc }: SortState): number {
    const av = String(a[sortBy] ?? '');
    const bv = String(b[sortBy] ?? '');

    // Bookmarks without a group stay at the end whichever way the column is sorted
    if (sortBy === 'group' && !av !== !bv) {
        return av ? -1 : 1;
    }

    const primary = collator.compare(av, bv);
    if (primary) {
        return isDesc ? -primary : primary;
    }
    return collator.compare(a.ticketNo, b.ticketNo);
}

/** One option per group in use, with its bookmark count, and "No group" last when there are any */
export function getGroupOptions(rows: GroupedRow[]): GroupOption[] {
    const counts = new Map<string, number>();
    rows.forEach((r) => counts.set(r.group, (counts.get(r.group) || 0) + 1));

    // Names that differ only in case compare equal; order them by code point so the list is stable
    const options = [...counts.keys()]
        .filter(Boolean)
        .sort((a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0))
        .map((g) => ({ value: g, label: `${g} (${counts.get(g)})` }));

    if (counts.has('')) {
        options.push({ value: NoGroup, label: `No group (${counts.get('')})` });
    }
    return options;
}

/** The remembered filter reduced to groups that still exist, so a vanished group cannot hide everything */
export function getActiveFilter(filter: string[], options: GroupOption[]): string[] {
    return filter.filter((g) => options.some((o) => o.value === g));
}

/** The rows to show: filtered to the active groups (all when none is chosen), then sorted */
export function getVisibleRows<T extends GroupedRow>(rows: T[], activeFilter: string[], sort: SortState): T[] {
    const kept = activeFilter.length ? rows.filter((r) => activeFilter.includes(r.group || NoGroup)) : rows;
    return [...kept].sort((a, b) => compareRows(a, b, sort));
}
