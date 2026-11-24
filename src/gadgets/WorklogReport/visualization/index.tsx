import { useMemo } from 'react';

import { EmptyState, Loading } from '@components';

import { inject } from '../../../services/injector';
import { connect, useWorklogGetState, type WorklogReportState } from '../datastore';

import { getOptionalFieldDimensions, groupWorklogs } from './breakdown-utils';
import GroupBreakdownCard from './GroupBreakdownCard';
import { getReportTargets, type ReportGroup, type ReportSprint, type TargetSource } from './target-utils';
import type { DailyTarget, OptionalReportField, VisualizationWorklog } from './types';
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
    optionalFields?: OptionalReportField[];
    hideEstimate: boolean;
    fromDate?: Date;
    toDate?: Date;
    groupedData?: ReportGroup[];
    sprints?: ReportSprint[];
}

type VisualizationProps = VisualizationOwnProps & VisualizationStateProps;

const secsPerHour = 60 * 60;
const zeroTime = '0h';

function Visualization({ flatData, groupField, isSprint, reportUserGrp, optionalFields, hideEstimate, fromDate, toDate, groupedData, sprints }: VisualizationProps) {
    const getState = useWorklogGetState();
    const { formatTime, daily, isHoliday, includeEpic } = useMemo(() => {
        const { $utils, $session, $userutils } = inject('UtilsService', 'SessionService', 'UserUtilsService');
        const { maxHours, minHours = maxHours, epicNameField } = $session.CurrentUser;
        const dailyTarget: DailyTarget = { minSecsPerDay: (minHours || 8) * secsPerHour, maxSecsPerDay: (maxHours || 8) * secsPerHour };
        return {
            formatTime: (secs: number) => $utils.formatSecs(secs) || zeroTime,
            daily: dailyTarget,
            isHoliday: $userutils.isHoliday,
            includeEpic: !!epicNameField?.id,
        };
    }, []);

    const groups = useMemo(() => (flatData ? groupWorklogs(flatData, groupField) : null), [flatData, groupField]);
    const fieldDimensions = useMemo(() => getOptionalFieldDimensions(optionalFields), [optionalFields]);
    const targets = useMemo(() => {
        const source: TargetSource = {
            isSprint,
            reportUserGrp,
            fromDate,
            toDate,
            groupedData,
            sprints,
            sprintGroups: getSprintGroups(getState(), sprints),
        };
        return getReportTargets(source, isHoliday);
    }, [isSprint, reportUserGrp, fromDate, toDate, groupedData, sprints, getState, isHoliday]);

    if (!flatData || !groups) {
        return <Loading />;
    }

    if (!flatData.length) {
        return <EmptyState className="worklog-visualization-tab" title="No worklogs to visualize" description="There are no worklogs for the selected users and period." variant="noResults" />;
    }

    const cardProps = { fieldDimensions, daily, showEstimates: !hideEstimate, includeEpic, formatTime };

    return (
        <div className="worklog-visualization-tab flex h-full flex-col gap-4 overflow-y-auto p-2 sm:p-4">
            {groups.length > 1 && <GroupBreakdownCard title={isSprint ? 'All Sprints' : 'All Groups'} worklogs={flatData} target={targets.all} {...cardProps} />}
            {groups.map((g) => (
                <GroupBreakdownCard
                    key={g.key}
                    title={g.key}
                    worklogs={g.worklogs}
                    reportUserGrp={reportUserGrp}
                    target={groups.length > 1 ? targets.byGroup[g.key] : (targets.byGroup[g.key] ?? targets.all)}
                    {...cardProps}
                />
            ))}
        </div>
    );
}

function getSprintGroups(state: WorklogReportState, sprints: ReportSprint[] | undefined): Record<number, ReportGroup[] | undefined> {
    const result: Record<number, ReportGroup[] | undefined> = {};
    sprints?.forEach(({ id }) => (result[id] = state[`groupReport_${id}`]?.groupedData));
    return result;
}

function mapStateToProps(state: WorklogReportState, { boardId }: VisualizationOwnProps): VisualizationStateProps {
    const isSprint = state.timeframeType === '1';
    const flatData = (isSprint ? state[`flatWorklogs_${boardId}`] : state.flatWorklogs) as VisualizationWorklog[] | undefined;
    const sprints = isSprint ? (state[`sprintsList_${boardId}`] as ReportSprint[] | undefined) : undefined;

    return {
        isSprint,
        flatData,
        groupField: isSprint ? 'sprintName' : 'groupName',
        reportUserGrp: state.reportUserGrp,
        optionalFields: state.fields?.optional,
        hideEstimate: !!state.fields?.hideEstimate,
        fromDate: state.dateRange?.fromDate,
        toDate: state.dateRange?.toDate,
        groupedData: state.groupReport?.groupedData,
        sprints,
    };
}

export default connect(Visualization, mapStateToProps);
