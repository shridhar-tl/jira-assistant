import React from 'react';
import { ScrollableTable } from '../../../components/ScrollableTable';
import { connect } from "../datastore";
import GroupBody from './GroupBody';
import GroupHead from './GroupHead';

function GroupedDataGrid({ boardId, fields, exportSheetName }) {
    const { showProject, showParentSummary, showIssueType, showEpic, showAssignee, showReporter } = fields || {};
    const addlColCount = 1
        + (showProject ? 1 : 0)
        + (showParentSummary ? 1 : 0)
        + (showIssueType ? 1 : 0)
        + (showEpic ? 1 : 0)
        + (showAssignee ? 1 : 0)
        + (showReporter ? 1 : 0);

    return (
        <ScrollableTable exportSheetName={exportSheetName}>
            <GroupHead addlColCount={addlColCount} boardId={boardId} />
            <GroupBody addlColCount={addlColCount} boardId={boardId} />
        </ScrollableTable>
    );
}

export default connect(GroupedDataGrid, ({ fields }) => ({ fields }));
