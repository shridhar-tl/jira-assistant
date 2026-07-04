import { useCallback } from 'react';

import { Modal, view } from '@forge/bridge';

import { Button } from '@components';

export interface TeamWorklogSettings {
    userListMode?: string;
    timeframeType?: string;
    userGroups?: unknown[];
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
    };
    logFormat?: string;
    breakupMode?: string;
    reportLoaded?: boolean;
    loadingData?: boolean;
    errorTitle?: string;
    errorMessage?: string;
    disableAddingWL?: boolean;
    groups?: unknown[];
    [key: string]: unknown;
}

interface EditConfigProps {
    settings: TeamWorklogSettings;
    onSettingsChange: (newSettings: Partial<TeamWorklogSettings>) => void;
}

export default function EditConfig({ settings, onSettingsChange }: EditConfigProps) {
    const saveSettings = useCallback(async () => {
        const toSave = { ...settings };
        await view.submit(toSave);
    }, [settings]);

    const showReportSettings = useCallback(() => {
        const modal = new Modal({
            onClose: (result: TeamWorklogSettings) => {
                if (result) {
                    onSettingsChange(result);
                }
            },
            size: 'large',
            context: { modalId: 'ja-dlg-wl-report-config', settings },
        });
        modal.open();
    }, [settings, onSettingsChange]);

    const showUserGroups = useCallback(() => {
        const modal = new Modal({
            onClose: (result: { userGroups?: unknown[] }) => {
                if (result) {
                    onSettingsChange(result);
                }
            },
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: settings?.groups },
        });
        modal.open();
    }, [settings?.groups, onSettingsChange]);

    return (
        <div className="h-112.5 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Button layout="plain" leftIcon={<i className="fa fa-users" />} onClick={showUserGroups}>
                    User Groups
                </Button>
                <Button layout="plain" leftIcon={<i className="fa fa-cogs" />} onClick={showReportSettings}>
                    Settings
                </Button>
            </div>
            <div className="flex justify-end mt-6">
                <Button leftIcon={<i className="fa fa-save" />} onClick={saveSettings}>
                    Done
                </Button>
            </div>
        </div>
    );
}
