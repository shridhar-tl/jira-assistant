import { sprintDataSource } from '../../types';
import { field } from '../fields';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'active-sprint-worklogs',
    title: 'Worklogs of the active sprint',
    description: 'Every worklog added to the issues of the latest sprint along with its author, time, duration and comment.',
    category: 'time',
    icon: 'fa-clock',
    definition: {
        dataSourceType: sprintDataSource,
        jql: 'timespent > 0',
        sprintsParameter: { range: 0 },
        fields: [
            field('issueKey'),
            field('summary'),
            field('worklogAuthor', { format: 'USR_NM' }),
            field('worklogTime', { agrFunc: 'none', format: 'DT_DF' }),
            field('worklogTimeSpent', { agrFunc: 'none', format: 'TS_FR' }),
            field('worklogComment', { agrFunc: 'none' }),
        ],
    },
};

export default sample;
