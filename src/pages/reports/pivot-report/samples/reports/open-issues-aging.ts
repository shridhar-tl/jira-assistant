import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { openIssuesJql, projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'open-issues-aging',
    title: 'Aging of open issues',
    description: 'Unresolved issues of each status and assignee with the age of the oldest issue, split by priority.',
    category: 'issues',
    icon: 'fa-hourglass-end',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND ${openIssuesJql} ORDER BY created`,
        fields: [
            field('status', { enableGrouping: true }),
            field('assignee', { enableGrouping: true, format: 'USR_NM_IMG' }),
            field('created', { agrFunc: 'min', headerText: 'Oldest issue', format: 'DT_AG' }),
            field('priority', { colGroup: true, showTotal: true, showTotalFirst: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
