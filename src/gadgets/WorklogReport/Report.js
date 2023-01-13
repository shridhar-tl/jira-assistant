import React from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import GroupedDataGrid from './userdaywise/GroupedDataGrid';
import { connect } from './datastore';
import FlatGroupableWorklog from './FlatGroupableWorklog';
import UserProjectWiseSummary from './userprojectwise';
import Visualization from './visualization';
import './WorklogGadget.scss';

const loader = (<div className="pad-15">Loading... please wait while the report is being loaded.
    It may take few seconds / minute based on the range/filters you had selected.</div>);

const noData = (<div className="pad-15">No data available to display.</div>);

function Report({ selSprints, isLoading, useSprint, hasData }) {
    if (isLoading) { return loader; }
    if (!hasData) { return null; }

    let reportData = null;
    if (useSprint) {
        const boards = Object.keys(selSprints).filter(k => selSprints[k]?.selected);

        if (boards.length > 1) {
            reportData = (<TabView className="no-padding multi-view" renderActiveOnly={false}>
                {boards.map(boardId => <TabPanel header={selSprints[boardId].name} contentClassName="no-padding">
                    <ReportData boardId={boardId} />
                </TabPanel>)}
            </TabView>);
        } else if (boards.length) {
            reportData = (<ReportData boardId={boards[0]} />);
        }
    } else {
        reportData = (<ReportData />);
    }

    return (<div className="worklog-report">{reportData}</div>);
}

export default connect(Report, ({ reportLoaded: hasData, timeframeType, selSprints }) => ({
    hasData, useSprint: timeframeType === '1', selSprints
}));


const ReportData = connect(function ({ boardId, hasData, showCostReport, showSummaryReport }) {
    if (!hasData) { return noData; }

    return (<TabView className="no-padding" renderActiveOnly={false}>
        <TabPanel header="Grouped - [User daywise]" contentClassName="no-padding">
            <GroupedDataGrid exportSheetName="Grouped - [User daywise]" boardId={boardId} />
        </TabPanel>
        {showCostReport && <TabPanel header="Cost Report" contentClassName="no-padding">
            <GroupedDataGrid exportSheetName="Cost Report" boardId={boardId} costView={true} />
        </TabPanel>}
        <TabPanel header="Flat (Groupable)" contentClassName="no-padding">
            <FlatGroupableWorklog exportSheetName="Flat (Groupable)" boardId={boardId} />
        </TabPanel>
        {showSummaryReport && <TabPanel header="Summary - (User project wise)" contentClassName="no-padding">
            <UserProjectWiseSummary exportSheetName="Flat (Groupable)" boardId={boardId} />
        </TabPanel>}
        <TabPanel header="Visualization" contentClassName="no-padding">
            <Visualization exportSheetName="Visualization" boardId={boardId} />
        </TabPanel>
    </TabView>);
}, (state, { boardId }) => {
    const isSprint = state.timeframeType === '1';
    const { userListMode, reportUserGrp, fields: { showCostReport },
        [isSprint ? `sprintsList_${boardId}` : 'groupReport']: hasData
    } = state;
    return {
        hasData: !!hasData,
        showCostReport: showCostReport && userListMode !== '1',
        showSummaryReport: !isSprint && reportUserGrp === '1'
    };
});