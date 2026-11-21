import { sprintDataSource } from '../../types';
import { field, issueCount, storyPointsSum } from '../fields';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'sprint-status-summary',
    title: 'Sprint status summary',
    description: 'Issues and story points of the recent sprints split by their current status. Shows how much of each sprint is done.',
    category: 'sprints',
    icon: 'fa-flag-checkered',
    definition: {
        dataSourceType: sprintDataSource,
        jql: '',
        sprintsParameter: { range: 3 },
        fields: [
            field('sprint', { enableGrouping: true }),
            field('status', { colGroup: true, showTotal: true, subItems: [issueCount(), storyPointsSum('SP')] }),
        ],
    },
};

export default sample;
