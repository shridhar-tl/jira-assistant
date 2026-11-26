import { useCallback, useLayoutEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router';

import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { Button, SampleReportBanner } from '@components';

import ReportSelectList from '@components/ReportSelectList';

import EditorBody from './editor/body';
import EditorControls from './editor/controls';
import SaveReportPrompt from './editor/SaveReportPrompt';
import { usePivotConfig, useReportData } from './store/pivot-config';
import { useReportParameters } from './store/report-parameters';
import { openSaveDialog } from './store/save-dialog';
import { getReportsHomePath, loadReport } from './utils/common';
import { generateReport } from './viewer/generator';

export default function PivotReport() {
    const { reportId, sampleId, userId = '' } = useParams<{ reportId?: string; sampleId?: string; userId?: string }>();
    const { state: navigationState } = useLocation();
    const navigate = useNavigate();
    const isNewReport = !reportId && !sampleId;
    const keepEditing = !!(navigationState as SavedReportNavigation | null)?.keepEditing;
    const [editMode, setEditMode] = useState(isNewReport || keepEditing);
    const toggleEdit = () => setEditMode((prev) => !prev);
    const sourceKey = `${reportId}|${sampleId}`;
    const [loadedSourceKey, setLoadedSourceKey] = useState(sourceKey);

    if (loadedSourceKey !== sourceKey) {
        setLoadedSourceKey(sourceKey);
        if (!keepEditing) {
            setEditMode(isNewReport);
        }
    }

    useLayoutEffect(() => {
        loadReport({ reportId, sampleId });
    }, [reportId, sampleId]);

    const reportName = usePivotConfig(({ queryName }) => queryName);
    const isSample = usePivotConfig(({ id, sampleId }) => !id && !!sampleId);
    const hasParams = useReportParameters(({ parameters }) => Object.keys(parameters).length > 0);
    const reportsHomePath = getReportsHomePath(userId);
    const goToReportsHome = useCallback(() => navigate(reportsHomePath), [navigate, reportsHomePath]);

    const gadgetHook = useBaseGadget(
        { isGadget: false },
        {
            title: reportName ? `${reportName} - [Pivot report]` : 'Pivot report',
            className: 'pivot-report-gadget',
        },
    );

    const customActions = (
        <>
            <Button layout="plain" leftIcon={<i className="fa fa-th-large" />} onClick={goToReportsHome} title="All pivot reports" size="sm" />
            <ReportSelectList reportType="pivot" reportId={reportId} reportPath={reportsHomePath} />
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
                    <div className="flex h-full min-h-0 flex-col">
                        {isSample && <SampleReportBanner title={reportName} onSave={openSaveDialog} onBack={goToReportsHome} />}
                        <div className="min-h-0 flex-1">
                            <EditorBody />
                        </div>
                    </div>
                </GadgetContainer>
            </div>
            <EditorControls
                key={reportId || (sampleId ? `sample-${sampleId}` : 'new')}
                reportId={reportId}
                showSourceFirst={isNewReport}
                show={editMode}
                onHide={toggleEdit}
            />
            <SaveReportPrompt />
        </div>
    );
}

interface SavedReportNavigation {
    keepEditing?: boolean;
}

function toggleParameters() {
    useReportData.setState(({ showParameters }) => ({ showParameters: !showParameters }));
}
