import React from 'react';
import Checkbox from '../../../controls/Checkbox';

function FieldsListSettings({ setValue, state: {
    showCostReport, showProject, showAssignee,
    showParentSummary, showIssueType, showEpic,
    showReporter, hideEstimate
} }) {
    return (<div className="settings-group">
        <div className="row">
            <div className="col-4">
                <Checkbox checked={showCostReport} onChange={(e) => setValue("showCostReport", e)} label="Show cost report" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>
            </div>
            <div className="col-4">
                <Checkbox checked={showProject} onChange={(e) => setValue("showProject", e)} label="Show Project details" />
            </div>
            <div className="col-4">
                <Checkbox checked={showParentSummary} onChange={(e) => setValue("showParentSummary", e)} label="Show Parent ticket" />
            </div>
            <div className="col-4">
                <Checkbox checked={showIssueType} onChange={(e) => setValue("showIssueType", e)} label="Show Issue Type" />
            </div>
            <div className="col-4">
                <Checkbox checked={showEpic} onChange={(e) => setValue("showEpic", e)} label="Show Epic" />
            </div>
            <div className="col-4">
                <Checkbox checked={showAssignee} onChange={(e) => setValue("showAssignee", e)} label="Show Assignee" />
            </div>
            <div className="col-4">
                <Checkbox checked={showReporter} onChange={(e) => setValue("showReporter", e)} label="Show Reporter" />
            </div>
            <div className="col-12">
                <Checkbox checked={hideEstimate} onChange={(e) => setValue("hideEstimate", e)} label="Hide estimate related fields" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>
            </div>
        </div>
    </div>
    );
}

export default FieldsListSettings;