import { getRouteUrl, isPluginBuild, isWebBuild } from "./constants/build-info";
import config from './customize';

export function getDashboardMenu(d, idx, userId) {
    if (!d) { return null; }

    const { icon, name } = d;

    return {
        name,
        id: `D-${idx}`,
        url: `/${userId}/dashboard/${idx}`,
        icon: icon,
        /*badge: {
            variant: 'info',
            text: 'NEW'
        },*/
        isDashboard: true
    };
}

const { dashboards,
    calendar, importWorklog, importIssues, planningPoker,

    // Reports
    worklogReport, sprintReport, customReport, estimateVsActual, reportBuilder,

    // Settings
    userGroups, generalSettings, advancedSettings,

    // Menu groups
    activitiesGroup = calendar || importWorklog || importIssues || planningPoker,
    reportsGroup = worklogReport || sprintReport || customReport || estimateVsActual || reportBuilder,
    settingsGroup = userGroups || generalSettings || advancedSettings
} = config.modules;

const navigation = [
    dashboards && {
        title: true,
        name: 'Dashboards',
        icon: 'fa fa-tachometer',
        isDashboard: true,
        items: [
            {
                name: 'Default',
                id: 'D-0',
                url: '/dashboard/0',
                icon: 'fa fa-tachometer',
                isDashboard: true
            }
        ]
    },
    activitiesGroup && {
        title: true,
        name: 'Activities',
        icon: 'fa fa-tachometer',
        items: [
            calendar && {
                name: 'Worklog Calendar',
                id: 'CAL',
                url: '/calendar',
                icon: 'fa fa-calendar'
            },
            importWorklog && {
                name: 'Import worklog',
                id: 'IMW',
                url: '/import/worklog',
                icon: 'fa fa-clock'
            },
            importIssues && {
                name: 'Import issue',
                id: 'IMI',
                url: '/import/issue',
                icon: 'fa fa-ticket',
                badge: {
                    variant: 'success',
                    text: 'BETA'
                }
            },
            planningPoker && {
                name: 'Poker',
                id: 'PLP',
                external: !isPluginBuild,
                url: getRouteUrl(isWebBuild ? '/../poker' : '/poker'),
                icon: 'fa fa-gamepad'
            }
        ].filter(Boolean)
    },
    reportsGroup && {
        title: true,
        name: 'Reports',
        icon: 'fa fa-bar-chart',
        items: [
            worklogReport && {
                name: 'Worklog Report',
                id: 'R-WL',
                url: '/reports/worklog',
                icon: 'fa fa-users'
            },
            sprintReport && {
                name: 'Sprint Report',
                id: 'R-SP',
                url: '/reports/sprint',
                icon: 'fa fa-history'
            },
            customReport && {
                name: 'Custom Report',
                id: 'R-CR',
                url: '/reports/custom',
                icon: 'fa fa-table'
            },
            estimateVsActual && {
                name: 'Estimate vs Actual',
                id: 'R-EA',
                url: '/reports/estimateactual',
                icon: 'fa fa-bar-chart'
            },
            reportBuilder && {
                name: 'Report Builder',
                id: 'R-CG',
                url: '/reports/advanced',
                icon: 'fa fa-table',
                badge: {
                    variant: 'success',
                    text: 'BETA'
                }
            }
        ].filter(Boolean)
    },
    settingsGroup && {
        title: true,
        name: 'Settings',
        icon: 'fa fa-cogs',
        items: [
            generalSettings && {
                name: 'General',
                id: 'S-GE',
                url: '/settings/general',
                icon: 'fa fa-cog'
            },
            userGroups && {
                name: 'User groups',
                id: 'S-UG',
                url: '/settings/usergroups',
                icon: 'fa fa-users'
            },
            advancedSettings && {
                name: 'Advanced',
                id: 'S-AD',
                url: '/settings/global',
                icon: 'fa fa-cogs'
            }
        ].filter(Boolean)
    }
].filter(Boolean);

export default navigation;