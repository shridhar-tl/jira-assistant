import { isPluginBuild } from './constants/build-info';

const config = {
    modules: {
        dashboards: true,

        calendar: true,
        importWorklog: true,
        importIssues: true,
        planningPoker: true,
        sprintPlanner: true,
        piPlanner: isPluginBuild,

        worklogReport: true,
        pivotReport: true,
        reportBuilder: true,
        sayDoRatioReport: true,
        sprintReport: !isPluginBuild,
        estimateVsActual: true,
        workloadHeatmap: true,
        timeInStatus: true,

        userGroups: true,
        generalSettings: true,
        advancedSettings: true,

        contactUs: !isPluginBuild,
    },
    features: {
        header: {
            shareWithOthers: !isPluginBuild,
            themes: !isPluginBuild,
            youtubeHelp: !isPluginBuild,
            devUpdates: !isPluginBuild,
            jiraUpdates: true,
        },
        dashboard: {
            manageBoard: true,
            manageGadgets: true,
        },
        integrations: {
            googleCalendar: !isPluginBuild,
            outlookCalendar: true,
        },
        common: {
            analytics: !isPluginBuild,
            allowWebVersion: !isPluginBuild,
        },
    },
    settings: {
        defaultIntegrateUrl: '',
    },
};

export default config;
