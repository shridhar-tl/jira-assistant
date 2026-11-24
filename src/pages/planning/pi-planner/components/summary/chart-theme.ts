export interface ChartTheme {
    text: string;
    muted: string;
    grid: string;
    surface: string;
}

export const seriesColors = {
    done: '#16a34a',
    inProgress: '#2563eb',
    todo: '#94a3b8',
    scope: '#64748b',
};

function readVar(style: CSSStyleDeclaration, name: string, fallback: string): string {
    return style.getPropertyValue(name).trim() || fallback;
}

/** Axis, label and grid colours from the page theme, so the charts follow light and dark mode. */
export function getChartTheme(): ChartTheme {
    const style = getComputedStyle(document.body);
    return {
        text: readVar(style, '--text-primary', '#1f2937'),
        muted: readVar(style, '--text-secondary', '#6b7280'),
        grid: readVar(style, '--border-secondary', 'rgba(0,0,0,0.08)'),
        surface: readVar(style, '--bg-primary', '#ffffff'),
    };
}
