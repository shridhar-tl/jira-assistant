import { epicPalette, jiraEpicColorMap } from './constants';
import type { StatusCategory } from './types';

export const statusCategoryClassNames: Record<StatusCategory, string> = {
    new: 'border-l-slate-400',
    indeterminate: 'border-l-blue-500',
    done: 'border-l-emerald-500',
};

export const statusCategoryBarColors: Record<StatusCategory, string> = {
    new: '#94a3b8',
    indeterminate: '#3b82f6',
    done: '#10b981',
};

function hash(value: string): number {
    let result = 0;
    for (let i = 0; i < value.length; i++) {
        result = (result * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(result);
}

/** Colour of an epic from Jira's issue colour field, or a stable colour from its key when Jira has none. */
export function getParentColor(key: string, jiraColor: string | null | undefined): string {
    if (jiraColor) {
        if (jiraColor.startsWith('#')) {
            return jiraColor;
        }
        const mapped = jiraEpicColorMap[jiraColor];
        if (mapped) {
            return mapped;
        }
    }
    return epicPalette[hash(key) % epicPalette.length];
}

/** Black or white text, whichever contrasts better with the background colour. */
export function getContrastText(background: string): string {
    const hex = background.replace('#', '');
    if (hex.length !== 6) {
        return '#ffffff';
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#172b4d' : '#ffffff';
}
