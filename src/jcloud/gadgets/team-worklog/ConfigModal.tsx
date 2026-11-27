import 'moment-timezone/builds/moment-timezone-with-data.min.js';

import { useCallback } from 'react';

import { type FullContext, view } from '@forge/bridge';

import { getInitialSettings, withProvider } from '@/gadgets/WorklogReport/datastore';
import ReportSettings, { type ReportSettingsResult } from '@/gadgets/WorklogReport/settings/ReportSettings';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';

interface ConfigModalProps {
    jiraContext: FullContext;
}

function ConfigModal() {
    const onDone = useCallback(({ modifiedSettings }: ReportSettingsResult) => view.close(modifiedSettings), []);

    return (
        <div className="flex min-h-137.5 flex-col bg-(--bg-primary) text-(--text-primary)">
            <h3 className="border-b border-(--border-primary) px-5 py-4 text-lg font-semibold">Report Configurations</h3>
            <ReportSettings onDone={onDone} />
        </div>
    );
}

export default withInitParams(
    withSimpleAuth(
        withProvider(ConfigModal, undefined, undefined, undefined, ({ jiraContext }: ConfigModalProps) =>
            getInitialSettings(jiraContext?.extension?.modal?.settings),
        ),
    ),
);
