import { sprintDataSource } from '../../types';
import { field } from '../fields';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'active-sprint-issues',
    title: 'Active sprint issue list',
    description: 'Flat list of the issues in the latest sprint in board rank order, with their estimate, time spent, parent and age.',
    category: 'sprints',
    icon: 'fa-list-ul',
    definition: {
        dataSourceType: sprintDataSource,
        jql: 'ORDER BY rank',
        sprintsParameter: { range: 0 },
        fields: [
            field('issueKey'),
            field('summary'),
            field('issueType'),
            field('status'),
            field('assignee', { format: 'USR_NM_IMG' }),
            field('storyPoints'),
            field('timeSpent', { format: 'TS_FR' }),
            field('labels'),
            field('parent', { format: 'PT_BT_ST' }),
            field('issueAge', { format: 'DT_AG' }),
        ],
    },
};

export default sample;
