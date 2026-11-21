import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'issues-created-weekly',
    title: 'Issues created per week',
    description: 'Number of issues of each type created in every week of the chosen period. Shows the trend of incoming work.',
    category: 'issues',
    icon: 'fa-chart-line',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND created >= startDate(parameters('Period')) AND created <= endDate(parameters('Period'))`,
        fields: [
            field('issueType', { enableGrouping: true }),
            field('dateRange', {
                colGroup: true,
                rangeType: 'week',
                dateRangeParameter: 'Period',
                filterField: 'created',
                showTotal: true,
                subItems: [issueCount()],
            }),
        ],
    },
};

export default sample;
