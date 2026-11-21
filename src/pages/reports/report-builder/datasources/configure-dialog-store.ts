import { create } from 'zustand';

import type { DatasourceConfigureRequest, DatasourceConfigureResult } from '@components/report-builder';

export type ConfigureDialogKind = 'jql' | 'sprint-issues' | 'sprints' | 'worklogs';

export interface PendingConfigureDialog {
    kind: ConfigureDialogKind;
    request: DatasourceConfigureRequest;
    resolve: (result: DatasourceConfigureResult | null) => void;
}

interface ConfigureDialogState {
    pending: PendingConfigureDialog | null;
}

export const useConfigureDialog = create<ConfigureDialogState>(() => ({ pending: null }));

export function openConfigureDialog(
    kind: ConfigureDialogKind,
    request: DatasourceConfigureRequest,
): Promise<DatasourceConfigureResult | null> {
    useConfigureDialog.getState().pending?.resolve(null);
    return new Promise((resolve) => {
        useConfigureDialog.setState({ pending: { kind, request, resolve } });
    });
}

export function closeConfigureDialog(result: DatasourceConfigureResult | null): void {
    const { pending } = useConfigureDialog.getState();
    useConfigureDialog.setState({ pending: null });
    pending?.resolve(result);
}
