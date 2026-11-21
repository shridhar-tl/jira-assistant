import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { openIssuesJql, projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'team-open-issues',
    title: 'Open issues of team members',
    description: 'Unresolved issues assigned to the chosen users or user groups, split by issue type.',
    category: 'issues',
    icon: 'fa-users',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND assignee in parameters('Team members') AND ${openIssuesJql}`,
        fields: [
            field('assignee', { enableGrouping: true, format: 'USR_NM_IMG' }),
            field('issueType', { colGroup: true, showTotal: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
