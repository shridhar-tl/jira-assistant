import type { FullContext } from '@forge/bridge';

export type DashboardHostType = 'gadget' | 'widget';

export interface DashboardItemProps {
    jiraContext: FullContext;
}

export const dashboardModuleKeys = {
    dateWiseWorklog: { gadget: 'ja-date-wise-worklog', widget: 'ja-date-wise-worklog-widget' },
    worklogTimer: { gadget: 'ja-worklog-timer', widget: 'ja-worklog-timer-widget' },
    worklogBarChart: { gadget: 'ja-worklog-barchart', widget: 'ja-worklog-barchart-widget' },
    teamWorklog: { gadget: 'ja-team-worklog', widget: 'ja-team-worklog-widget' },
    workloadHeatmap: { widget: 'ja-workload-heatmap' },
    timeInStatus: { widget: 'ja-time-in-status' },
} as const;

const widgetModuleKeys = new Set<string>(Object.values(dashboardModuleKeys).map((keys) => keys.widget));

export function getDashboardHostType(jiraContext: FullContext): DashboardHostType {
    return widgetModuleKeys.has(jiraContext?.moduleKey) ? 'widget' : 'gadget';
}

export function isDashboardItemEdit(jiraContext: FullContext): boolean {
    return jiraContext?.extension?.entryPoint === 'edit';
}

export function getDashboardItemConfig<T extends object>(jiraContext: FullContext): Partial<T> {
    const extension = jiraContext?.extension;
    const config = getDashboardHostType(jiraContext) === 'widget' ? extension?.config : extension?.gadgetConfiguration;
    return (config || {}) as Partial<T>;
}
