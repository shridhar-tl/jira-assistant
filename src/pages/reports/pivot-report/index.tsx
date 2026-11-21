import { useEffect, useState } from 'react';

import { useLocation, useParams } from 'react-router';

import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { Button } from '@components';

import ReportSelectList from '@components/ReportSelectList';

import EditorBody from './editor/body';
import EditorControls from './editor/controls';
import { usePivotConfig, useReportData } from './store/pivot-config';
import { useReportParameters } from './store/report-parameters';
import { loadReport } from './utils/common';
import { generateReport } from './viewer/generator';

export default function PivotReport() {
    const { reportId, userId } = useParams<{ reportId?: string; userId?: string }>();
    const { state: navigationState } = useLocation();
    const [editMode, setEditMode] = useState(!reportId);
    const toggleEdit = () => setEditMode((prev) => !prev);

    useEffect(() => {
        loadReport(reportId);
        if (!(navigationState as SavedReportNavigation | null)?.keepEditing) {
            setEditMode(!reportId);
        }
    }, [reportId]);

    const reportName = usePivotConfig(({ queryName }) => queryName);
    const hasParams = useReportParameters(({ parameters }) => Object.keys(parameters).length > 0);

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
        <div className="flex h-[calc(100vh-3rem)]">
            <div className="flex-1 min-w-0">
                <GadgetContainer isGadget={false} gadgetHook={gadgetHook} customActions={customActions} refreshData={generateReport}>
                    <EditorBody />
                </GadgetContainer>
            </div>
            <EditorControls key={reportId || 'new'} reportId={reportId} show={editMode} onHide={toggleEdit} />
        </div>
    );
}

interface SavedReportNavigation {
    keepEditing?: boolean;
}

function toggleParameters() {
    useReportData.setState(({ showParameters }) => ({ showParameters: !showParameters }));
}
