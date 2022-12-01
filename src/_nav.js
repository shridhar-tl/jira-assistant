import { isWebBuild } from "./constants/build-info";

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

export const navigation = [
    {
        title: true,
        name: 'Dashboards',
        isDashboard: true
    },
    {
        name: 'Default',
        id: 'D-0',
        url: '/dashboard/0',
        icon: 'fa fa-tachometer',
        isDashboard: true
    },
    {
        title: true,
        name: 'Activities'
    },
    {
        name: 'Worklog Calendar',
        id: 'CAL',
        url: '/calendar',
        icon: 'fa fa-calendar'
    },
    {
        name: 'Import worklog',
        id: 'IMW',
        url: '/import/worklog',
        icon: 'fa fa-clock-o'
    },
    {
        name: 'Import issue',
        id: 'IMI',
        url: '/import/issue',
        icon: 'fa fa-ticket',
        badge: {
            variant: 'success',
            text: 'BETA'
        }
    },
    {
        name: 'Poker',
        id: 'PLP',
        url: isWebBuild ? '/../poker' : '/poker',
        icon: 'fa fa-gamepad',
        badge: {
            variant: 'success',
            text: 'BETA'
        },
        attributes: { target: '_blank', rel: "noopener" }
    },
    {
        title: true,
        name: 'Reports'
    },
    {
        name: 'Worklog Report',
        id: 'R-UD',
        url: '/reports/userdaywise',
        icon: 'fa fa-users'
    },
    {
        name: 'Worklog Report',
        id: 'R-WL',
        url: '/reports/worklog',
        icon: 'fa fa-users',
        badge: {
            variant: 'success',
            text: 'BETA'
        }
    },
    {
        name: 'Sprint Report',
        id: 'R-SP',
        url: '/reports/sprint',
        icon: 'fa fa-history'
    },
    {
        name: 'Custom Report',
        id: 'R-CR',
        url: '/reports/custom',
        icon: 'fa fa-table'
    },
    {
        name: 'Estimate vs Actual',
        id: 'R-EA',
        url: '/reports/estimateactual',
        icon: 'fa fa-bar-chart'
    },
    {
        name: 'Report Builder',
        id: 'R-CG',
        url: '/reports/advanced',
        icon: 'fa fa-table',
        badge: {
            variant: 'success',
            text: 'BETA'
        }
    },
    {
        title: true,
        name: 'Settings'
    },
    {
        name: 'General',
        id: 'S-GE',
        url: '/settings/general',
        icon: 'fa fa-cog'
    },
    {
        name: 'User groups',
        id: 'S-UG',
        url: '/settings/usergroups',
        icon: 'fa fa-users'
    },
    {
        name: 'Advanced',
        id: 'S-AD',
        url: '/settings/global',
        icon: 'fa fa-cogs'
    }
];

const nav = { items: navigation };

export default nav;
