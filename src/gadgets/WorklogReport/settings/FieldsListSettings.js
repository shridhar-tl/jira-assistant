import React from 'react';
import Checkbox from '../../../controls/Checkbox';

function FieldsListSettings({ setFieldValue, fields }) {
    const {
        showCostReport, showProject, showAssignee,
        showParentSummary, showIssueType, showEpic,
        showReporter, hideEstimate
    } = fields;

    return (<div className="settings-group">
        <div className="row">
            <div className="col-4">
                <Checkbox checked={showCostReport} onChange={setFieldValue} field="showCostReport" label="Show cost report" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>
            </div>
            <div className="col-4">
                <Checkbox checked={showProject} onChange={setFieldValue} field="showProject" label="Show Project details" />
            </div>
            <div className="col-4">
                <Checkbox checked={showParentSummary} onChange={setFieldValue} field="showParentSummary" label="Show Parent ticket" />
            </div>
            <div className="col-4">
                <Checkbox checked={showIssueType} onChange={setFieldValue} field="showIssueType" label="Show Issue Type" />
            </div>
            <div className="col-4">
                <Checkbox checked={showEpic} onChange={setFieldValue} field="showEpic" label="Show Epic" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Epic data would be visible only if field is selected from General settings -> Default value tab" /> )</span>
            </div>
            <div className="col-4">
                <Checkbox checked={showAssignee} onChange={setFieldValue} field="showAssignee" label="Show Assignee" />
            </div>
            <div className="col-4">
                <Checkbox checked={showReporter} onChange={setFieldValue} field="showReporter" label="Show Reporter" />
            </div>
            <div className="col-12">
                <Checkbox checked={hideEstimate} onChange={setFieldValue} field="hideEstimate" label="Hide estimate related fields" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>
            </div>
        </div>
    </div>
    );
}

export default React.memo(FieldsListSettings);