import { jqlDataSource } from '../../types';
import { field, issueCount, storyPointsSum } from '../fields';
import { projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'story-points-by-parent',
    title: 'Story points by parent and status',
    description: 'Story points of the chosen issue types under each parent (epic) split by status. Tracks the progress of every epic.',
    category: 'releases',
    icon: 'fa-sitemap',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND parent is not EMPTY`,
        fields: [
            field('parent', { enableGrouping: true, format: 'PT_BT_ST' }),
            issueCount(),
            field('status', {
                colGroup: true,
                showTotal: true,
                subItems: [
                    field('issueType', {
                        enableGrouping: true,
                        filter: 'issuetype in (parameters(\'Issue types\'))',
                        subItems: [storyPointsSum('SP')],
                    }),
                ],
            }),
        ],
    },
};

export default sample;
