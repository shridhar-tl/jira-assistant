import { isPluginBuild } from "./constants/build-info";

const config = {
    modules: { // Controls if a specific module should be included in build or not
        dashboards: true,

        // Activities
        calendar: true,
        importWorklog: true,
        importIssues: true,
        planningPoker: !isPluginBuild,

        // Reports
        worklogReport: true,
        worklogReportOld: true,
        pivotReport: true,
        sprintReport: !isPluginBuild,
        customReport: true,
        estimateVsActual: true,
        reportBuilder: true,

        // Settings
        userGroups: true,
        generalSettings: true,
        advancedSettings: true,

        // Others
        contactUs: !isPluginBuild,
        contribute: !isPluginBuild
    },
    features: {
        header: {
            shareWithOthers: true,
            themes: true,
            youtubeHelp: !isPluginBuild,
            devUpdates: !isPluginBuild,
            jiraUpdates: true
        },
        dashboard: {
            manageBoard: true,
            manageGadgets: true
        },
        integrations: {
            googleCalendar: !isPluginBuild,
            outlookCalendar: true
        },
        common: {
            analytics: !isPluginBuild,
            allowWebVersion: !isPluginBuild
        }
    },
    settings: {
        defaultIntegratUrl: ''
    }
};

export default config;