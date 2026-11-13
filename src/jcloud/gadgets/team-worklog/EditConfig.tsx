import { useCallback } from 'react';

import { Modal } from '@forge/bridge';

import { Button } from '@components';

import GadgetMessage from '../../components/GadgetMessage';
import type { DashboardHostType } from '../../dashboard-host';
import useDashboardItemConfig from '../../useDashboardItemConfig';

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
    [key: string]: unknown;
}

interface EditConfigProps {
    hostType: DashboardHostType;
    settings: TeamWorklogSettings;
}

export default function EditConfig({ hostType, settings: initialSettings }: EditConfigProps) {
    const { settings, saveError, isWidget, update, submit } = useDashboardItemConfig({ hostType, initialSettings });

    const showReportSettings = useCallback(() => {
        const modal = new Modal({
            onClose: (result?: TeamWorklogSettings) => {
                if (result) {
                    update(result);
                }
            },
            size: 'large',
            context: { modalId: 'ja-dlg-wl-report-config', settings },
        });
        modal.open();
    }, [settings, update]);

    const showUserGroups = useCallback(() => {
        const modal = new Modal({
            onClose: (result?: { userGroups?: unknown[] }) => {
                if (result?.userGroups) {
                    update({ userGroups: result.userGroups });
                }
            },
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: settings.userGroups },
        });
        modal.open();
    }, [settings.userGroups, update]);

    return (
        <div className="h-112.5 p-4">
            {saveError && <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />}
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                    <span className="fa fa-sliders-h text-(--primary-color)" />
                    Team worklog configuration
                </div>
                <p className="mb-4 text-xs text-(--text-secondary)">
                    {isWidget
                        ? 'Configure the user groups and report settings, then save the widget.'
                        : 'Configure the user groups and report settings, then click Done to save the gadget.'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <Button layout="plain" leftIcon={<i className="fa fa-users" />} onClick={showUserGroups}>
                        User Groups
                    </Button>
                    <Button layout="plain" leftIcon={<i className="fa fa-cogs" />} onClick={showReportSettings}>
                        Settings
                    </Button>
                </div>
                {!isWidget && (
                    <div className="mt-6 flex justify-end">
                        <Button leftIcon={<i className="fa fa-save" />} onClick={submit}>
                            Done
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
