import { jqlDataSource } from '../../types';
import { field, issueCount, storyPointsSum } from '../fields';
import { openIssuesJql, projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'open-work-by-assignee',
    title: 'Open work by assignee and priority',
    description: 'Unresolved issues of each assignee split by priority, with the pending story points and remaining estimate.',
    category: 'issues',
    icon: 'fa-user-clock',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND ${openIssuesJql} ORDER BY priority DESC`,
        fields: [
            field('assignee', { enableGrouping: true, format: 'USR_NM_IMG' }),
            storyPointsSum(),
            field('remainingEstimate', { agrFunc: 'sum', format: 'TS_FR' }),
            field('priority', { colGroup: true, showTotal: true, showTotalFirst: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
