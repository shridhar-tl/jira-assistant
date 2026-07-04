import { isPluginBuild } from './constants/build-info';

const config = {
    modules: {
        dashboards: true,

        calendar: true,
        importWorklog: true,
        importIssues: true,
        planningPoker: !isPluginBuild,

        worklogReport: true,
        pivotReport: true,
        sayDoRatioReport: true,
        sprintReport: !isPluginBuild,
        estimateVsActual: true,

        userGroups: true,
        generalSettings: true,
        advancedSettings: true,

        contactUs: !isPluginBuild,
        contribute: !isPluginBuild,
    },
    features: {
        header: {
            shareWithOthers: true,
            themes: true,
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
