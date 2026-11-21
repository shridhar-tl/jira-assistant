import { useMemo } from 'react';

import { ReportBuilder } from '@components/report-builder';

import { datasourcePlugins, parameterPlugins } from './config/runtime';
import { createSubReportHooks } from './report-store';
import { refreshSubReports, updateDefinition, useBuilderPage } from './store/builder-page-store';

const builderStyle = { height: '100%' };

export default function ReportDesigner() {
    const definition = useBuilderPage((s) => s.report.definition);
    const loadToken = useBuilderPage((s) => s.loadToken);
    const subReports = useBuilderPage((s) => s.subReports);
    const hooks = useMemo(() => createSubReportHooks(refreshSubReports), []);

    return (
        <ReportBuilder
            key={loadToken}
            definition={definition}
            onChange={updateDefinition}
            datasourcePlugins={datasourcePlugins}
            parameterPlugins={parameterPlugins}
            availableSubReports={subReports}
            resolveSubReport={hooks.resolveSubReport}
            onSaveSubReport={hooks.onSaveSubReport}
            onCreateSubReport={hooks.onCreateSubReport}
            style={builderStyle}
        />
    );
}
