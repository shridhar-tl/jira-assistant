const config = {
    modules: { // Controls if a specific module should be included in build or not
        dashboards: true,

        // Activities
        calendar: true,
        importWorklog: true,
        importIssues: true,
        planningPoker: true,

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
        contactUs: true,
        contribute: true
    },
    features: {
        header: {
            shareWithOthers: true,
            themes: true,
            youtubeHelp: true,
            devUpdates: true,
            jiraUpdates: true
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