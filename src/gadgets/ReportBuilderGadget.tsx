import { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import { Button } from '@components';

import type { ReportViewerHandle } from '@components/report-viewer';

import { loadBuilderReport, type SavedBuilderReport } from '../pages/reports/report-builder/report-store';
import BuilderReportViewer from '../pages/reports/report-builder/viewer/BuilderReportViewer';
import { pickDefinedParameterValues } from '../pages/reports/report-builder/viewer/parameter-values';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';

interface ReportBuilderGadgetProps extends BaseGadgetProps {
    reportId: string;
    title: string;
}

interface LoadedReport {
    requestKey: string;
    report: SavedBuilderReport | null;
}

type LoadState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; report: SavedBuilderReport };

export default function ReportBuilderGadget(props: ReportBuilderGadgetProps) {
    const { reportId, title } = props;
    const [reloadCount, setReloadCount] = useState(0);
    const [loaded, setLoaded] = useState<LoadedReport | null>(null);
    const [initialParameters] = useState(() => props.settings?.parameters as Record<string, unknown> | undefined);
    const viewerRef = useRef<ReportViewerHandle>(null);
    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();
    const requestKey = `${reportId}:${reloadCount}`;

    useEffect(() => {
        let active = true;
        loadBuilderReport(parseInt(reportId)).then(
            (report) => active && setLoaded({ requestKey, report }),
            () => active && setLoaded({ requestKey, report: null }),
        );
        return () => {
            active = false;
        };
    }, [reportId, requestKey]);

    const state: LoadState =
        !loaded || loaded.requestKey !== requestKey
            ? { status: 'loading' }
            : loaded.report
              ? { status: 'ready', report: loaded.report }
              : { status: 'missing' };

    const report = state.status === 'ready' ? state.report : null;
    const gadgetHook = useBaseGadget(props, { title: report?.queryName || title || 'Report' });
    const { settingsRef, saveSettings } = gadgetHook;

    const handleParameterChange = useCallback(
        (values: Record<string, unknown>) => {
            if (!report) return;
            settingsRef.current = { ...settingsRef.current, parameters: pickDefinedParameterValues(report.definition, values) };
            saveSettings();
        },
        [report, settingsRef, saveSettings],
    );

    const refresh = useCallback(() => {
        if (viewerRef.current) viewerRef.current.refresh();
        else setReloadCount((c) => c + 1);
    }, []);

    const hasParameters = !!report && report.definition.parameters.length > 0;

    const customActions = (
        <>
            {hasParameters && (
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<i className="fa fa-list-check" />}
                    onClick={() => viewerRef.current?.showParameters()}
                    title="Change report parameters"
                />
            )}
            {report && (
                <>
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-print" />}
                        onClick={() => viewerRef.current?.print()}
                        title="Print"
                    />
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-file-pdf" />}
                        onClick={() => viewerRef.current?.exportPdf()}
                        title="Export as PDF"
                    />
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-edit" />}
                        onClick={() => navigate(`/${userId}/reports/builder/${reportId}`)}
                        title="Open in Report Builder"
                    />
                </>
            )}
        </>
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} customActions={customActions} refreshData={refresh}>
            {state.status === 'loading' && <div className="p-6 text-center text-sm text-(--text-secondary)">Loading report…</div>}
            {state.status === 'missing' && (
                <div className="p-6 text-center text-sm text-(--text-secondary)">
                    This report no longer exists. Remove the gadget or choose another report.
                </div>
            )}
            {report && (
                <div className="flex min-h-[320px] flex-col">
                    <BuilderReportViewer
                        definition={report.definition}
                        parameterValues={initialParameters}
                        onParameterChange={handleParameterChange}
                        viewerRef={viewerRef}
                        hideToolbar
                    />
                </div>
            )}
        </GadgetContainer>
    );
}
