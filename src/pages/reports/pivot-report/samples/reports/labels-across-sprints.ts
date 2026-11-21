import { sprintDataSource } from '../../types';
import { field, issueCount } from '../fields';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'labels-across-sprints',
    title: 'Labels across sprints',
    description: 'Number of issues carrying each label in every sprint. Useful to spot recurring themes or tech debt across sprints.',
    category: 'sprints',
    icon: 'fa-tags',
    definition: {
        dataSourceType: sprintDataSource,
        jql: '',
        sprintsParameter: { range: 5 },
        fields: [field('labels', { enableGrouping: true }), field('sprint', { colGroup: true, showTotal: true, subItems: [issueCount()] })],
    },
};

export default sample;
