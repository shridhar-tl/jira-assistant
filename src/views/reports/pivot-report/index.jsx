import React from 'react';
import { useParams } from 'react-router-dom';
import useToggler from 'react-controls/hooks/useToggler';
import { Button } from 'src/controls';
import GadgetLayout from 'src/gadgets/Gadget';
import { generateReport } from './viewer/generator';
import { usePivotConfig, useReportData } from './store/pivot-config';
import { loadReport } from './utils/common';
import EditorControls from './editor/controls';
import EditorBody from './editor/body';
import ReportSelectList from '../../../components/ReportSelectList';
import './Style.scss';

function PivotReport() {
    const { reportId, userId } = useParams();
    const [editMode, toggleEdit] = useToggler(!reportId);

    React.useEffect(() => {
        loadReport(reportId);
    }, [reportId]);

    const isLoading = useReportData(({ isFetching }) => isFetching);
    const { queryName: reportName, parameters } = usePivotConfig(({ queryName, parameters }) => ({ queryName, parameters }));

    const hasParams = parameters && Object.keys(parameters).length > 0;

    const customActions = (<>
        <ReportSelectList reportType="pivot" reportId={reportId} reportPath={`/${userId}/reports/pivot`} />
        {hasParams && <Button type="secondary" icon="fa fa-list-check" className="mx-1"
            onClick={toggleParameters} title="Show report parameters" />}
        <Button type="secondary" icon="fa fa-edit" className="mx-1"
            onClick={toggleEdit} title="Edit report definition" />
    </>);

    return (<>
        <EditorControls reportId={reportId} show={editMode} onHide={toggleEdit} />
        <div className="page-container">
            <GadgetLayout title={reportName ? `${reportName} - [Pivot report]` : "Pivot report"}
                isGadget={false} isLoading={isLoading}
                customActions={customActions} onRefresh={generateReport}
            >
                <EditorBody />
            </GadgetLayout>
        </div>
    </>);
}

export default PivotReport;

function toggleParameters() {
    useReportData.setState(({ showParameters }) => ({ showParameters: !showParameters }));
}