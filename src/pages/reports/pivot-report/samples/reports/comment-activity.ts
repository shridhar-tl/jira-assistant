import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'comment-activity',
    title: 'Comment activity by user',
    description: 'Number of issues each user has commented on, split by issue type, with the time of their latest comment.',
    category: 'issues',
    icon: 'fa-comments',
    definition: {
        dataSourceType: jqlDataSource,
        jql: projectsJql,
        fields: [
            field('commentAuthor', { enableGrouping: true }),
            issueCount('Issues commented'),
            field('commentCreated', { agrFunc: 'max', headerText: 'Last commented', format: 'DT_AG' }),
            field('issueType', { colGroup: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
