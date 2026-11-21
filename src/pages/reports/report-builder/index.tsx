import { useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router';

import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { inject } from '@services';

import { Button, SampleReportBanner } from '@components';

import ReportSelectList from '@components/ReportSelectList';

import { Dialog } from '@dialogs/CommonDialog';
import SaveReportDialog from '@dialogs/SaveReportDialog';

import DatasourceDialogHost from './datasources/DatasourceDialogHost';
import { builderReportType } from './report-store';
import ReportDesigner from './ReportDesigner';
import { deletePageReport, loadPageReport, loadPageSample, savePageReport, setPageMode, useBuilderPage } from './store/builder-page-store';
import BuilderReportViewer from './viewer/BuilderReportViewer';

interface BuilderNavigationState {
    keepEditing?: boolean;
}

const pageTitle = 'Report Builder';
const unsavedChangesMessage = 'You have unsaved changes in this report. Do you want to discard them?';

export default function ReportBuilderPage() {
    const { reportId, sampleId, userId } = useParams<{ reportId?: string; sampleId?: string; userId?: string }>();
    const { state: navigationState } = useLocation();
    const navigate = useNavigate();
    const report = useBuilderPage((s) => s.report);
    const mode = useBuilderPage((s) => s.mode);
    const isDirty = useBuilderPage((s) => s.isDirty);
    const isLoading = useBuilderPage((s) => s.isLoading);
    const isSample = useBuilderPage((s) => !s.report.id && !!s.report.sampleId);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const reportPath = `/${userId}/reports/builder`;

    useEffect(() => {
        if (sampleId) loadPageSample(sampleId);
        else loadPageReport(reportId ? parseInt(reportId) : undefined, (navigationState as BuilderNavigationState | null)?.keepEditing);
    }, [reportId, sampleId]); // eslint-disable-line react-hooks/exhaustive-deps

    const gadgetHook = useBaseGadget(
        { isGadget: false },
        {
            title: report.queryName ? `${report.queryName} - [${pageTitle}]` : pageTitle,
            hideMenu: true,
            className: 'report-builder-gadget',
        },
    );

    const confirmDiscard = useCallback((action: () => void) => {
        if (!useBuilderPage.getState().isDirty) {
            action();
            return;
        }
        Dialog.yesNo(unsavedChangesMessage, 'Unsaved changes').then(action);
    }, []);

    const handleNew = useCallback(() => {
        confirmDiscard(() => {
            if (reportId || sampleId) navigate(`${reportPath}/new`);
            else loadPageReport(undefined);
        });
    }, [confirmDiscard, navigate, reportId, sampleId, reportPath]);

    const goToReportsHome = useCallback(() => confirmDiscard(() => navigate(reportPath)), [confirmDiscard, navigate, reportPath]);

    const persist = useCallback(
        async (queryName?: string, asCopy?: boolean) => {
            const { $message } = inject('MessageService');
            try {
                const id = await savePageReport(queryName, asCopy);
                $message.success('Report saved successfully');
                setSaveDialogOpen(false);
                if (String(id) !== reportId) {
                    navigate(`${reportPath}/${id}`, { state: { keepEditing: true } satisfies BuilderNavigationState });
                }
            } catch (err) {
                $message.error((err as { message?: string } | null)?.message || 'Unable to save the report', 'Save failed');
            }
        },
        [navigate, reportId, reportPath],
    );

    const handleSave = useCallback(() => {
        if (report.id) persist();
        else setSaveDialogOpen(true);
    }, [report.id, persist]);

    const handleDelete = useCallback(() => {
        Dialog.confirmDelete(`Are you sure to delete the report "${report.queryName}" permanently?`, 'Delete report').then(async () => {
            const { $message } = inject('MessageService');
            await deletePageReport();
            $message.success('Report deleted successfully');
            navigate(reportPath);
        });
    }, [report.queryName, navigate, reportPath]);

    const hasComponents = report.definition.components.length > 0;

    const customActions = (
        <>
            <Button layout="plain" size="sm" leftIcon={<i className="fa fa-th-large" />} onClick={goToReportsHome} title="All report builder reports" />
            <ReportSelectList reportType={builderReportType} reportId={reportId} reportPath={reportPath} />
            {isDirty && <span className="hidden px-2 text-xs text-(--text-secondary) sm:inline">Unsaved changes</span>}
            <Button layout="plain" size="sm" leftIcon={<i className="fa fa-plus" />} onClick={handleNew} title="Create a new report" />
            {mode === 'design' ? (
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<i className="fa fa-eye" />}
                    onClick={() => setPageMode('view')}
                    disabled={!hasComponents}
                    title="View the report"
                />
            ) : (
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<i className="fa fa-edit" />}
                    onClick={() => setPageMode('design')}
                    title="Edit the report design"
                />
            )}
            <Button
                layout="plain"
                size="sm"
                leftIcon={<i className="fa fa-save" />}
                onClick={handleSave}
                disabled={!isDirty && !!report.id}
                title="Save report"
            />
            {report.id && (
                <>
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-copy" />}
                        onClick={() => setSaveDialogOpen(true)}
                        title="Save as / rename"
                    />
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-trash" />}
                        onClick={handleDelete}
                        title="Delete report"
                    />
                </>
            )}
        </>
    );

    return (
        <div className="flex h-[calc(100vh-60px)]">
            <div className="min-w-0 flex-1">
                <GadgetContainer isGadget={false} gadgetHook={gadgetHook} customActions={customActions} config={{ hideRefresh: true }}>
                    <div className="flex h-full min-h-0 flex-col">
                        {isSample && !isLoading && <SampleReportBanner title={report.queryName} onSave={() => setSaveDialogOpen(true)} onBack={goToReportsHome} />}
                        <div className="min-h-0 flex-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8 text-sm text-(--text-secondary)">Loading report…</div>
                            ) : mode === 'design' ? (
                                <ReportDesigner />
                            ) : (
                                <BuilderReportViewer key={report.id ?? report.sampleId ?? 'new'} definition={report.definition} />
                            )}
                        </div>
                    </div>
                </GadgetContainer>
            </div>
            <DatasourceDialogHost />
            {saveDialogOpen && (
                <SaveReportDialog
                    queryName={report.queryName || report.definition.metadata.title}
                    allowCopy={!!report.id}
                    onHide={() => setSaveDialogOpen(false)}
                    onChange={(name, copy) => persist(name, copy)}
                />
            )}
        </div>
    );
}
