export interface MenuItem {
    name: string;
    id: string;
    url: string;
    icon: string;
    external?: boolean;
    badge?: {
        variant: string;
        text: string;
    };
    isDashboard?: boolean;
}

export interface MenuSection {
    name: string;
    title?: boolean;
    isDashboard?: boolean;
    items: MenuItem[];
}

export function getDashboardMenu(d: any, idx: number, userId: number): MenuItem {
    if (!d) return null as any;

    const { icon, name } = d;

    return {
        name,
        id: `D-${idx}`,
        url: `/${userId}/dashboard/${idx}`,
        icon: icon || 'fa fa-tachometer',
        isDashboard: true,
    };
}

export const navigation: MenuSection[] = [
    {
        name: 'Dashboards',
        title: true,
        isDashboard: true,
        items: [
            {
                name: 'Default',
                id: 'D-0',
                url: '/dashboard/0',
                icon: 'fa fa-tachometer',
                isDashboard: true,
            },
        ],
    },
    {
        name: 'Activities',
        title: true,
        items: [
            {
                name: 'Worklog Calendar',
                id: 'CAL',
                url: '/calendar',
                icon: 'fa fa-calendar',
            },
            {
                name: 'Import worklog',
                id: 'IMW',
                url: '/import/worklog',
                icon: 'fa fa-clock',
            },
            {
                name: 'Poker',
                id: 'PLP',
                url: '/poker',
                icon: 'fa fa-gamepad',
            },
        ],
    },
    {
        name: 'Reports',
        title: true,
        items: [
            {
                name: 'Worklog Report',
                id: 'R-WL',
                url: '/reports/worklog',
                icon: 'fa fa-users',
            },
            {
                name: 'Sprint Report',
                id: 'R-SP',
                url: '/reports/sprint',
                icon: 'fa fa-line-chart',
            },
        ],
    },
    {
        name: 'Settings',
        title: true,
        items: [
            {
                name: 'User Groups',
                id: 'SET-UG',
                url: '/settings/groups',
                icon: 'fa fa-users',
            },
            {
                name: 'General',
                id: 'SET-GEN',
                url: '/settings/general',
                icon: 'fa fa-cog',
            },
            {
                name: 'Advanced',
                id: 'SET-ADV',
                url: '/settings/advanced',
                icon: 'fa fa-cogs',
            },
        ],
    },
    {
        name: 'Help',
        title: true,
        items: [
            {
                name: 'Feedback',
                id: 'FEEDBACK',
                url: '/feedback',
                icon: 'fa fa-comment',
            },
            {
                name: 'FAQs',
                id: 'FAQ',
                url: 'https://jiraassistant.com/faq',
                icon: 'fa fa-question-circle',
                external: true,
            },
        ],
    },
];
