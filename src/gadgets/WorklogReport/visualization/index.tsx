import { useMemo } from 'react';

import { EmptyState, Loading } from '@components';

import { inject } from '../../../services/injector';
import { connect, type WorklogReportState } from '../datastore';

import { groupWorklogs } from './breakdown-utils';
import GroupBreakdownCard from './GroupBreakdownCard';
import type { VisualizationWorklog } from './types';
import './Style.css';

interface VisualizationOwnProps {
    exportSheetName: string;
    boardId?: string;
}

interface VisualizationStateProps {
    flatData?: VisualizationWorklog[];
    groupField: 'sprintName' | 'groupName';
    isSprint: boolean;
    reportUserGrp: string;
}

type VisualizationProps = VisualizationOwnProps & VisualizationStateProps;

function Visualization({ flatData, groupField, isSprint, reportUserGrp }: VisualizationProps) {
    const formatTime = useMemo(() => {
        const { $utils } = inject('UtilsService');
        return (secs: number) => $utils.formatSecs(secs);
    }, []);

    const groups = useMemo(() => (flatData ? groupWorklogs(flatData, groupField) : null), [flatData, groupField]);

    if (!flatData || !groups) {
        return <Loading />;
    }

    if (!flatData.length) {
        return <EmptyState className="worklog-visualization-tab" title="No worklogs to visualize" description="There are no worklogs for the selected users and period." variant="noResults" />;
    }

    return (
        <div className="worklog-visualization-tab flex h-full flex-col gap-4 overflow-y-auto p-2 sm:p-4">
            {groups.length > 1 && <GroupBreakdownCard title={isSprint ? 'All Sprints' : 'All Groups'} worklogs={flatData} formatTime={formatTime} />}
            {groups.map((g) => (
                <GroupBreakdownCard key={g.key} title={g.key} worklogs={g.worklogs} reportUserGrp={reportUserGrp} formatTime={formatTime} />
            ))}
        </div>
    );
}

function mapStateToProps(state: WorklogReportState, { boardId }: VisualizationOwnProps): VisualizationStateProps {
    const isSprint = state.timeframeType === '1';
    const flatData = (isSprint ? state[`flatWorklogs_${boardId}`] : state.flatWorklogs) as VisualizationWorklog[] | undefined;
    return { isSprint, flatData, groupField: isSprint ? 'sprintName' : 'groupName', reportUserGrp: state.reportUserGrp };
}

export default connect(Visualization, mapStateToProps);
