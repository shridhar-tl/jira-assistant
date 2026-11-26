export interface DashboardIcon {
    icon: string;
    label: string;
}

export const DASHBOARD_ICONS: DashboardIcon[] = [
    { icon: 'fa-solid fa-gauge-high', label: 'Gauge' },
    { icon: 'fa-solid fa-chart-line', label: 'Line chart' },
    { icon: 'fa-solid fa-chart-column', label: 'Column chart' },
    { icon: 'fa-solid fa-chart-pie', label: 'Pie chart' },
    { icon: 'fa-solid fa-chart-area', label: 'Area chart' },
    { icon: 'fa-solid fa-chart-simple', label: 'Bar chart' },
    { icon: 'fa-solid fa-chart-gantt', label: 'Timeline' },
    { icon: 'fa-solid fa-square-poll-vertical', label: 'Poll' },
    { icon: 'fa-solid fa-magnifying-glass-chart', label: 'Analysis' },
    { icon: 'fa-solid fa-arrow-trend-up', label: 'Trend' },
    { icon: 'fa-solid fa-bullseye', label: 'Goal' },
    { icon: 'fa-solid fa-list-check', label: 'Checklist' },
    { icon: 'fa-solid fa-clipboard-list', label: 'Tasks' },
    { icon: 'fa-solid fa-calendar-days', label: 'Calendar' },
    { icon: 'fa-solid fa-clock', label: 'Time' },
    { icon: 'fa-solid fa-hourglass-half', label: 'Hourglass' },
    { icon: 'fa-solid fa-briefcase', label: 'Work' },
    { icon: 'fa-solid fa-people-group', label: 'Team' },
    { icon: 'fa-solid fa-layer-group', label: 'Layers' },
    { icon: 'fa-solid fa-diagram-project', label: 'Project' },
    { icon: 'fa-solid fa-table-cells-large', label: 'Grid' },
    { icon: 'fa-solid fa-ticket', label: 'Tickets' },
    { icon: 'fa-solid fa-bug', label: 'Bugs' },
    { icon: 'fa-solid fa-code', label: 'Code' },
    { icon: 'fa-solid fa-rocket', label: 'Release' },
    { icon: 'fa-solid fa-bolt', label: 'Sprint' },
    { icon: 'fa-solid fa-fire', label: 'Hot' },
    { icon: 'fa-solid fa-trophy', label: 'Trophy' },
    { icon: 'fa-solid fa-star', label: 'Star' },
    { icon: 'fa-solid fa-flag', label: 'Milestone' },
];

export const defaultDashboardIcon = DASHBOARD_ICONS[0].icon;

const iconStyle = /(^|\s)(fa|fas|far|fab|fa-solid|fa-regular|fa-brands)(\s|$)/;

export function dashboardIconClass(icon?: string): string {
    if (!icon) return defaultDashboardIcon;
    return iconStyle.test(icon) ? icon : `fa ${icon}`;
}
