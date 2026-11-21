import { jqlDataSource } from '../../types';
import { field, worklogPeriodColumn } from '../fields';
import { projectsJql, worklogPeriodJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'weekly-effort-by-parent',
    title: 'Weekly effort by parent and user',
    description: 'Time logged against each parent (epic) by every user in each week of the chosen period, grouped by month.',
    category: 'time',
    icon: 'fa-business-time',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND ${worklogPeriodJql}`,
        fields: [
            field('parent', { enableGrouping: true, format: 'PT_BT' }),
            field('worklogAuthor', { enableGrouping: true }),
            worklogPeriodColumn('week', { showTotalFirst: true }),
        ],
    },
};

export default sample;
