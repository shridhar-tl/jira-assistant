import React from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import GroupedDataGrid from './userdaywise/GroupedDataGrid';
import { connect } from './datastore';
import './WorklogGadget.scss';

const loader = (<div className="pad-15">Loading... please wait while the report is being loaded.
    It may take few seconds / minute based on the range you had selected.</div>);

function Report({ selSprints, isLoading, useSprint, hasData }) {
    if (isLoading) {
        return loader;
    }
    if (!hasData) { return null; }

    let reportData = null;
    if (useSprint) {
        const boards = Object.keys(selSprints).filter(k => selSprints[k]?.selected);

        if (boards.length > 1) {
            reportData = (<TabView className="no-padding" renderActiveOnly={false}>
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


const ReportData = connect(function ({ boardId, hasData, showCostReport }) {
    if (!hasData) { return null; }

    return (<TabView className="no-padding" renderActiveOnly={false}>
        <TabPanel header="Grouped - [User daywise]" contentClassName="no-padding">
            <GroupedDataGrid exportSheetName="Grouped - [User daywise]" boardId={boardId} />
        </TabPanel>
        {showCostReport && <TabPanel header="Cost Report" contentClassName="no-padding">
            <GroupedDataGrid exportSheetName="Cost Report" boardId={boardId} costView={true} />
        </TabPanel>}
    </TabView>);
}, (state, { boardId }) => {
    const { timeframeType, fields: { showCostReport },
        [timeframeType === '1' ? `sprintsList_${boardId}` : 'reportLoaded']: hasData
    } = state;
    return { hasData: !!hasData, showCostReport };
});