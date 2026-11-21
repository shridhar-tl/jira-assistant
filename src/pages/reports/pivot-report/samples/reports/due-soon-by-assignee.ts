import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { openIssuesJql, projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'due-soon-by-assignee',
    title: 'Overdue or due in 60 days',
    description: 'Unresolved issues of each assignee which are overdue or due within the next 60 days, with the earliest due date.',
    category: 'issues',
    icon: 'fa-hourglass-half',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND duedate is not EMPTY AND ${openIssuesJql}`,
        fields: [
            field('assignee', { enableGrouping: true, filter: 'duedate <= today(60)' }),
            issueCount(),
            field('dueDate', { agrFunc: 'min', headerText: 'Earliest due date' }),
            field('issueKey', { agrFunc: 'merge', headerText: 'Issues' }),
        ],
    },
};

export default sample;
