import { TabPage, TabView } from '@components';

import { useWorklogStore } from './datastore';
import FlatGroupableWorklog from './FlatGroupableWorklog';
import IssueDayWiseGrid from './issue-daywise';
import GroupedDataGrid from './userdaywise/GroupedDataGrid';
import UserProjectWiseSummary from './userprojectwise';
import Visualization from './visualization';
import './WorklogReport.css';

const loader = (
    <div className="flex items-center gap-3 p-6 text-sm text-secondary">
        <i className="fa fa-spinner fa-spin text-lg text-blue-500" />
        <span>
            Loading... please wait while the report is being loaded. It may take a few seconds / minutes based on the range/filters you have
            selected.
        </span>
    </div>
);

const noData = (
    <div className="flex items-center gap-2 p-6 text-sm text-secondary">
        <i className="fa fa-info-circle text-amber-500" />
        <span>No data available to display.</span>
    </div>
);

interface ReportProps {
    isLoading?: boolean;
    onSettingsChanged?: () => void;
}

export default function Report({ isLoading, onSettingsChanged }: ReportProps) {
    const { reportLoaded, timeframeType, selSprints } = useWorklogStore();

    if (isLoading) {
        return loader;
    }
    if (!reportLoaded) {
        return null;
    }

    const useSprint = timeframeType === '1';
    let reportData = null;

    if (useSprint) {
        const boards = Object.keys(selSprints).filter((k) => selSprints[k]?.selected);

        if (boards.length > 1) {
            reportData = (
                <TabView className="no-padding multi-view">
                    {boards.map((boardId) => (
                        <TabPage key={boardId} header={selSprints[boardId].name} className="no-padding">
                            <ReportData boardId={boardId} onSettingsChanged={onSettingsChanged} />
                        </TabPage>
                    ))}
                </TabView>
            );
        } else if (boards.length) {
            reportData = <ReportData boardId={boards[0]} onSettingsChanged={onSettingsChanged} />;
        }
    } else {
        reportData = <ReportData onSettingsChanged={onSettingsChanged} />;
    }

    return <div className="worklog-report">{reportData}</div>;
}

interface ReportDataProps {
    boardId?: string;
    onSettingsChanged?: () => void;
}

function ReportData({ boardId, onSettingsChanged }: ReportDataProps) {
    const state = useWorklogStore();
    const { timeframeType, userListMode, reportUserGrp, fields } = state;

    const isSprint = timeframeType === '1';
    // For sprint mode check userGroup_ (the processed user data), for date range check groupReport
    const stateKey = isSprint ? `userGroup_${boardId}` : 'groupReport';
    const hasData = !!state[stateKey];

    const showCostReport = fields?.showCostReport && userListMode === '2';
    const showSummaryReport = !isSprint && reportUserGrp === '1';

    if (!hasData) {
        return noData;
    }

    return (
        <TabView className="no-padding">
            <TabPage header="Grouped - [User daywise]" className="no-padding">
                <GroupedDataGrid exportSheetName="Grouped - [User daywise]" boardId={boardId} />
            </TabPage>
            {showCostReport && (
                <TabPage header="Cost Report" className="no-padding">
                    <GroupedDataGrid exportSheetName="Cost Report" boardId={boardId} costView={true} />
                </TabPage>
            )}
            {!isSprint && (
                <TabPage header="Flat - [Issue daywise]" className="no-padding">
                    <IssueDayWiseGrid exportSheetName="Flat - [Issue daywise]" boardId={boardId} />
                </TabPage>
            )}
            <TabPage header="Flat (Groupable)" className="no-padding">
                <FlatGroupableWorklog exportSheetName="Flat (Groupable)" boardId={boardId} onSettingsChanged={onSettingsChanged} />
            </TabPage>
            {showSummaryReport && (
                <TabPage header="Summary - (User project wise)" className="no-padding">
                    <UserProjectWiseSummary exportSheetName="Summary (User project wise)" boardId={boardId} />
                </TabPage>
            )}
            <TabPage header="Visualization" className="no-padding">
                <Visualization exportSheetName="Visualization" boardId={boardId} />
            </TabPage>
        </TabView>
    );
}
