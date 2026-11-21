import { jqlDataSource } from '../../types';
import { field, issueCount, storyPointsSum } from '../fields';
import { openIssuesJql, projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'unassigned-backlog',
    title: 'Unassigned backlog',
    description: 'Unresolved issues which are not assigned to anyone yet, grouped by issue type and split by priority.',
    category: 'issues',
    icon: 'fa-inbox',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND assignee is EMPTY AND ${openIssuesJql}`,
        fields: [
            field('issueType', { enableGrouping: true }),
            storyPointsSum(),
            field('created', { agrFunc: 'min', headerText: 'Oldest issue', format: 'DT_AG' }),
            field('priority', { colGroup: true, showTotal: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
