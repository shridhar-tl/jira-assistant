import { jqlDataSource } from '../../types';
import { field, issueCount } from '../fields';
import { projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'bugs-by-component',
    title: 'Bugs by component and priority',
    description: 'Bugs of each component split by priority along with the age of the oldest bug. Choose the issue types used for bugs.',
    category: 'issues',
    icon: 'fa-bug',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND issuetype in parameters('Bug issue types')`,
        fields: [
            field('components', { enableGrouping: true }),
            field('created', { agrFunc: 'min', headerText: 'Oldest bug', format: 'DT_AG' }),
            field('priority', { colGroup: true, showTotal: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
