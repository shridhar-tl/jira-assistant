import React from 'react';
import { SelectBox } from '../controls';
import { inject } from 'src/services';
import { useNavigate } from 'react-router-dom';

function ReportSelectList({ reportId, reportType, reportPath }) {
    const [reportsList, setList] = React.useState();
    const navigate = useNavigate();

    React.useEffect(() => {
        getReportsList(reportType).then(setList);
    }, [reportType]);

    const changeHandler = React.useCallback((reportId) => {
        if (reportId) {
            navigate(`${reportPath}/${reportId}`);
        }
    }, [navigate, reportPath]);

    if (!reportsList?.length) {
        return null;
    }

    return (<SelectBox className="report-picker" dataset={reportsList} value={parseInt(reportId)} valueField="value"
        onChange={changeHandler} placeholder="Select a report to edit" />);
}

export default ReportSelectList;

async function getReportsList(reportType) {
    const { $report } = inject('ReportService');

    const result = await $report.getReportsList();

    const reportsList = result
        .filter(q => q.reportType === reportType)
        .map(q => ({ value: q.id, label: q.queryName }));

    return reportsList;
}