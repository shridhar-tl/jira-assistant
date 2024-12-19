import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import GroupTable from './group-table';
import { updateParameters, usePivotConfig, useReportData } from '../../store/pivot-config';
import ReportInfo from './ReportInfo';
import { Form, FormDatePicker, FormTextBox, FormMultiValueText } from 'react-controls/controls/form';
import { Button } from 'react-controls/controls';
import { generateReport } from '../../viewer/generator';

function EditorBody() {
    const { hasReportData, reportErrors, isFetching, showParameters } = useReportData(useShallow(({
        reportData, reportErrors, isFetching, showParameters
    }) => ({ hasReportData: !!reportData, reportErrors, isFetching, showParameters })));

    if (isFetching) {
        return (<div className="editor-body p-4">
            <strong>Please wait while the data is being pulled from Jira. This may take a while depending on the number of issues being pulled.</strong>
        </div>);
    }

    return (<div className="editor-body">
        {reportErrors && <ReportErrorsSummary errors={reportErrors} />}
        {showParameters && <ReportParameters />}
        {hasReportData && <GroupTable />}
        {!hasReportData && !showParameters && <ReportInfo />}
    </div>);
}

export default EditorBody;

function ReportErrorsSummary({ errors }) {
    return (<div className="p-3">
        <h2>Report Definition Error</h2>
        <p>The report definition has one or more errors. Please fix it before you try to generate report</p>
        <ul className="msg-error">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
    </div>);
}

function ReportParameters() {
    const parameters = usePivotConfig(({ parameters }) => parameters);
    const keys = Object.keys(parameters);

    return (<Form value={parameters} onChange={updateParameters}>
        <div className="p-3">
            <strong>Provide values for missing parameters to generate report:</strong>
            <br />
            {keys.map((key) => <div key={key} className="param-field py-3">
                <label className="font-bold me-3">{parameters[key].name}: </label>
                <ParameterControl {...parameters[key]} />
            </div>)}
            <br />
            <Button icon="fa fa-refresh" label="Generate Report" onClick={generateReport} />
        </div>
    </Form>);
}

function ParameterControl({ type, isArray, name }) {
    const field = `${name.toLowerCase()}.value`;

    switch (type) {
        default:
            if (isArray) {
                return (<FormMultiValueText field={field} clearIfEmpty />);
            } else {
                return (<FormTextBox field={field} />);
            }
        case 'daterange':
            return (<FormDatePicker field={field} range={true} />);
        case 'datetime':
            return (<FormDatePicker field={field} showTime={true} />);
        case 'date':
            return (<FormDatePicker field={field} showTime={false} />);
        case 'usergroup':
            return (<span className="link">Select users</span>); // ToDo: need to implement
    }
}