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
        icon: 'fa fa-ticket'
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
            variant: 'info',
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
    },
    {
        title: true,
        name: 'Other'
    },
    {
        name: 'Help / FAQ',
        id: 'FAQ',
        url: '/faq',
        icon: 'fa fa-question'
    },
    {
        name: 'Contact us',
        id: 'SUP',
        url: '/feedback',
        icon: 'fa fa-bug'
    }
];

const nav = { items: navigation };

export default nav;
