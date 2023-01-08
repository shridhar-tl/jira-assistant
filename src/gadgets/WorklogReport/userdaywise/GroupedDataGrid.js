import React from 'react';
import { ScrollableTable } from '../../../components/ScrollableTable';
import { connect } from "../datastore";
import GroupBody from './GroupBody';
import GroupHead from './GroupHead';
import './Common.scss';

function GroupedDataGrid({ boardId, fields, exportSheetName, costView }) {
    const { showProject, showParentSummary, showIssueType, showStatus, showEpic, showAssignee, showReporter } = fields || {};
    const addlColCount = 1
        + (showProject ? 1 : 0)
        + (showParentSummary ? 1 : 0)
        + (showIssueType ? 1 : 0)
        + (showStatus ? 1 : 0)
        + (showEpic ? 1 : 0)
        + (showAssignee ? 1 : 0)
        + (showReporter ? 1 : 0);

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <GroupHead addlColCount={addlColCount} boardId={boardId} />
            <GroupBody addlColCount={addlColCount} boardId={boardId} costView={costView} />
        </ScrollableTable>
    );
}

export default connect(GroupedDataGrid, ({ fields }) => ({ fields }));
