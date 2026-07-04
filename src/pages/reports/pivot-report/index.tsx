import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { Button } from '@components';

import ReportSelectList from '@components/ReportSelectList';

import EditorBody from './editor/body';
import EditorControls from './editor/controls';
import { usePivotConfig, useReportData } from './store/pivot-config';
import { loadReport } from './utils/common';
import { generateReport } from './viewer/generator';

export default function PivotReport() {
    const { reportId, userId } = useParams<{ reportId?: string; userId?: string }>();
    const [editMode, setEditMode] = useState(!reportId);
    const toggleEdit = () => setEditMode((prev) => !prev);

    useEffect(() => {
        loadReport(reportId);
    }, [reportId]);

    const reportName = usePivotConfig(({ queryName }) => queryName);
    const parameters = usePivotConfig(({ parameters }) => parameters);

    const hasParams = parameters && Object.keys(parameters).length > 0;

    const gadgetHook = useBaseGadget(
        { isGadget: false },
        {
            title: reportName ? `${reportName} - [Pivot report]` : 'Pivot report',
            className: 'pivot-report-gadget',
        },
    );

    const customActions = (
        <>
            <ReportSelectList reportType="pivot" reportId={reportId} reportPath={`/${userId}/reports/pivot`} />
            {hasParams && (
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-list-check" />}
                    onClick={toggleParameters}
                    title="Show report parameters"
                    size="sm"
                />
            )}
            <Button layout="plain" leftIcon={<i className="fa fa-edit" />} onClick={toggleEdit} title="Edit report definition" size="sm" />
        </>
    );

    return (
        <div className="flex" style={{ height: 'calc(100vh - 60px)' }}>
            <div className="flex-1 min-w-0">
                <GadgetContainer isGadget={false} gadgetHook={gadgetHook} customActions={customActions} refreshData={generateReport}>
                    <EditorBody />
                </GadgetContainer>
            </div>
            <EditorControls reportId={reportId} show={editMode} onHide={toggleEdit} />
        </div>
    );
}

function toggleParameters() {
    useReportData.setState(({ showParameters }) => ({ showParameters: !showParameters }));
}
