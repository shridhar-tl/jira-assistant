import { sprintDataSource } from '../../types';
import { field, storyPointsSum } from '../fields';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'sprint-velocity',
    title: 'Velocity by issue type',
    description: 'Story points delivered in each of the last five sprints for the chosen issue types, along with the number of contributors.',
    category: 'sprints',
    icon: 'fa-gauge-high',
    definition: {
        dataSourceType: sprintDataSource,
        jql: 'issuetype in parameters(\'Issue types\') ORDER BY created',
        sprintsParameter: { range: 5 },
        fields: [
            field('sprint', { enableGrouping: true }),
            field('assignee', { agrFunc: 'count', useDistinct: true, headerText: 'Contributors' }),
            field('issueType', { colGroup: true, showTotal: true, subItems: [storyPointsSum('SP')] }),
        ],
    },
};

export default sample;
