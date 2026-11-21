import { jqlDataSource } from '../../types';
import { field, issueCount, storyPointsSum } from '../fields';
import { projectsJql } from '../jql';
import type { PivotSampleReport } from '../types';

const sample: PivotSampleReport = {
    id: 'release-scope',
    title: 'Release scope by fix version',
    description: 'Issues and story points planned for each fix version split by status, along with the release date.',
    category: 'releases',
    icon: 'fa-rocket',
    definition: {
        dataSourceType: jqlDataSource,
        jql: `${projectsJql} AND fixVersion is not EMPTY`,
        fields: [
            field('fixVersionName', { enableGrouping: true }),
            field('fixVersionReleaseDate', { agrFunc: 'first', headerText: 'Release date' }),
            storyPointsSum(),
            field('status', { colGroup: true, showTotal: true, subItems: [issueCount()] }),
        ],
    },
};

export default sample;
