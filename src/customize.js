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
        sprintReport: true,
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
            shareWithOthers: !isPluginBuild,
            themes: true,
            youtubeHelp: !isPluginBuild,
            devUpdates: !isPluginBuild,
            jiraUpdates: !isPluginBuild
        },
        dashboard: {
            manageBoard: true,
            manageGadgets: true
        },
        integrations: {
            googleCalendar: true,
            outlookCalendar: true
        },
        common: {
            analytics: true,
            allowWebVersion: true
        }
    },
    settings: {
        defaultIntegratUrl: ''
    }
};

export default config;