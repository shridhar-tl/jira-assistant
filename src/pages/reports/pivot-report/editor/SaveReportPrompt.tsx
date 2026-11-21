import { useCallback } from 'react';

import { useNavigate } from 'react-router';

import { inject } from '@services';

import SaveReportDialog from '@dialogs/SaveReportDialog';

import { usePivotConfig } from '../store/pivot-config';
import { closeSaveDialog, useSaveDialog } from '../store/save-dialog';
import { getReportPath, saveReportAs } from '../utils/common';

export default function SaveReportPrompt() {
    const navigate = useNavigate();
    const isOpen = useSaveDialog(({ isOpen }) => isOpen);
    const hasId = usePivotConfig(({ id }) => !!id);
    const isSample = usePivotConfig(({ id, sampleId }) => !id && !!sampleId);
    const queryName = usePivotConfig(({ queryName }) => queryName);

    const save = useCallback(
        async (name: string, copy?: boolean) => {
            try {
                const result = await saveReportAs(name, copy);
                closeSaveDialog();

                if (result) {
                    const { id, createdBy } = result;
                    navigate(getReportPath(createdBy, id), { state: { keepEditing: !isSample } });
                }
            } catch (err) {
                const { $message } = inject('MessageService');
                $message.error((err as { message?: string })?.message || 'Unable to save the report', 'Save failed');
            }
        },
        [navigate, isSample],
    );

    if (!isOpen) {
        return null;
    }

    return <SaveReportDialog queryName={hasId || isSample ? queryName : ''} allowCopy={hasId} onHide={closeSaveDialog} onChange={save} />;
}
