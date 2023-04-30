import React, { useCallback } from 'react';
import Checkbox from '../../../controls/Checkbox';
import JiraFieldMultiSelect from '../../../jira-controls/JiraFieldMultiSelect';

const hideTypes = ['array', 'option'];
const hideKeys = ['key', 'summary', 'issuetype'];

function FieldsListSettings({ setFieldValue, fields }) {
    const {
        optional, daywiseFields = {},
        showCostReport, hideEstimate
    } = fields;

    const setSelectedFields = useCallback((sel, field) => {
        if (sel) {
            setFieldValue({ ...daywiseFields, [field]: true }, 'daywiseFields');
        } else {
            const val = { ...daywiseFields };
            delete val[field];
            setFieldValue(val, 'daywiseFields');
        }
    }, [daywiseFields, setFieldValue]);

    return (<div className="settings-group">
        <div className="row">
            <div className="col-4">
                <Checkbox checked={showCostReport} onChange={setFieldValue} field="showCostReport" label="Show cost report" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle"
                    title="Change will take effect only after report is refreshed" /> )</span>
            </div>
            <div className="col-8">
                <Checkbox checked={hideEstimate} onChange={setFieldValue} field="hideEstimate" label="Hide estimate related fields" />
                <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>
            </div>
            <div className="col-12">
                <strong>Additional fields to pull from Jira</strong>
                <JiraFieldMultiSelect value={optional} field="optional" onChange={setFieldValue}
                    hideTypes={hideTypes} hideKeys={hideKeys} />
                <span>These fields would be displayed in Flat (Groupable)</span>
            </div>
            <div className="col-12">
                <strong>Additional fields to be displayed in Grouped - [User daywise] report</strong>
                <div className="row">
                    {optional.map(f => (
                        <div className="col-4">
                            <Checkbox key={f.key} checked={daywiseFields?.[f.key]} onChange={setSelectedFields} field={f.key} label={f.name} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
}

export default React.memo(FieldsListSettings);