import { jqlDataSource } from '../../types';
import { field, worklogPeriodColumn } from '../fields';
import { projectsJql, worklogPeriodJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'daily-timesheet',
    title: 'Daily timesheet',
    description: 'Time logged by each user on every day of the chosen period, grouped by week.',
    category: 'time',
    icon: 'fa-calendar-days',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND ${worklogPeriodJql}`,
        fields: [field('worklogAuthor', { enableGrouping: true }), worklogPeriodColumn('days')],
    },
};

export default sample;
