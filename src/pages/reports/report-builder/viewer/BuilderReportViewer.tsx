import { useMemo, type Ref } from 'react';

import { ReportViewer, type ReportDefinition, type ReportViewerHandle } from '@components/report-viewer';

import { datasourcePlugins, parameterPlugins } from '../config/runtime';
import { resolveSubReportDefinition } from '../report-store';

import { reviveParameterValues } from './parameter-values';

interface BuilderReportViewerProps {
    definition: ReportDefinition;
    parameterValues?: Record<string, unknown>;
    onParameterChange?: (values: Record<string, unknown>) => void;
    viewerRef?: Ref<ReportViewerHandle>;
    hideToolbar?: boolean;
    className?: string;
}

const parameterPanel = { mode: 'docked' as const, position: 'left' as const };

export default function BuilderReportViewer({
    definition,
    parameterValues,
    onParameterChange,
    viewerRef,
    hideToolbar,
    className,
}: BuilderReportViewerProps) {
    const revived = useMemo(() => reviveParameterValues(definition, parameterValues), [definition, parameterValues]);

    return (
        <ReportViewer
            definition={definition}
            datasourcePlugins={datasourcePlugins}
            parameterPlugins={parameterPlugins}
            resolveSubReport={resolveSubReportDefinition}
            parameterValues={revived}
            onParameterChange={onParameterChange}
            parameterPanel={parameterPanel}
            viewerRef={viewerRef}
            hideToolbar={hideToolbar}
            className={className}
        />
    );
}
