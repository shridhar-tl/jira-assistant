import { useCallback, useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';

import { convertToStorableValue } from '@/common/storage-helpers';
import { ScrollableTable, TBody, THead, TRow } from '@/components/shared/ScrollableTable';
import { SystemUserId } from '@/constants/common';
import { EventCategory } from '@/constants/settings';
import type { BackupSettings } from '@/services/backup-service';

import { inject } from '@services';

import { Button, Checkbox, Modal } from '@components';

import { saveStringAs } from '@utils/helpers';

interface ExportSettingsProps {
    onDone: () => void;
    onHide: () => void;
}

interface UserEntry {
    id: number;
    jiraUrl?: string;
}

const COLUMN_HELP: Record<string, string> = {
    reports: 'Saved reports and report filters',
    groups: 'User groups created in the Settings page',
    settings: 'Preferences, calendars, and all other configuration',
};

export default function ExportSettings({ onDone, onHide }: ExportSettingsProps) {
    const [users, setUsers] = useState<UserEntry[] | null>(null);
    const [settings, setSettings] = useState<BackupSettings>({});
    const [exportAll, setExportAll] = useState(true);
    const [showDialog, setShowDialog] = useState(true);

    const { $user, $backup, $analytics } = inject('UserService', 'BackupService', 'AnalyticsService');

    useEffect(() => {
        $user.getAllUsers().then((u: UserEntry[]) => setUsers(u));
    }, [$user]);

    const hasSelection = Object.keys(settings).length > 0;
    const fileName = useMemo(() => `JA_Backup_${format(new Date(), 'yyyyMMdd')}.jab`, []);

    const setValue = useCallback((value: boolean, field: string, user: UserEntry) => {
        setSettings((prev) => {
            const next = { ...prev };
            const us = { ...next[user.id] } as Record<string, boolean>;

            if (value) {
                us[field] = value;
            } else {
                delete us[field];
            }

            if (Object.keys(us).length) {
                next[user.id] = us;
            } else {
                delete next[user.id];
            }

            return next;
        });
    }, []);

    const handleExport = useCallback(async () => {
        const data = await $backup.exportBackup(exportAll || settings);
        const json = convertToStorableValue(data);
        saveStringAs(json, 'jab', fileName);
        $analytics.trackEvent('Settings exported', EventCategory.UserActions);
        setShowDialog(false);
        onHide();
    }, [$backup, $analytics, exportAll, settings, fileName, onHide]);

    const handleClose = useCallback(() => {
        setShowDialog(false);
        onHide();
    }, [onHide]);

    const footer = (
        <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 text-[12px] text-(--text-secondary) min-w-0">
                <i className="fa fa-file-archive-o text-(--text-tertiary)" />
                <span className="truncate">
                    Will download as <span className="font-medium text-(--text-primary)">{fileName}</span>
                </span>
            </div>
            <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={handleClose} leftIcon={<i className="fa fa-times" />}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleExport}
                    disabled={!exportAll && !hasSelection}
                    leftIcon={<i className="fa fa-download" />}
                >
                    Export
                </Button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={showDialog} onClose={handleClose} title="Export Settings" size="xl" footer={footer}>
            <div className="flex flex-col gap-4">
                <p className="text-[13px] text-(--text-secondary) m-0">
                    Download a backup of your Jira Assistant data. You can restore it later from any device using <span className="font-medium text-(--text-primary)">Import Settings</span>.
                </p>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-(--primary-light) border border-(--border-primary)">
                    <Checkbox
                        checked={exportAll}
                        onChange={(e) => setExportAll(e.value)}
                        label={
                            <span className="text-[13px] font-semibold text-(--text-primary)">Export everything</span>
                        }
                    />
                    <span className="text-[12px] text-(--text-secondary) leading-snug pt-px">
                        {exportAll
                            ? 'All instances, reports, user groups, and settings will be included.'
                            : 'Pick exactly what to include from the table below.'}
                    </span>
                </div>

                {!users ? (
                    <div className="flex items-center justify-center py-10 text-(--text-secondary)">
                        <i className="fa fa-spinner fa-spin mr-2" /> Loading instances...
                    </div>
                ) : (
                    <div className="rounded-lg border border-(--border-primary) overflow-hidden">
                        <ScrollableTable dataset={users} height="auto">
                            <THead>
                                <TRow>
                                    <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-(--text-secondary) bg-(--bg-secondary) border-b border-(--border-primary)">
                                        Instance
                                    </th>
                                    <ExportColHeader title="Reports" help={COLUMN_HELP.reports} />
                                    <ExportColHeader title="User Groups" help={COLUMN_HELP.groups} />
                                    <ExportColHeader title="Settings" help={COLUMN_HELP.settings} />
                                </TRow>
                            </THead>
                            <TBody>
                                {users.map((u, i) => {
                                    const isGeneral = u.id === SystemUserId;
                                    return (
                                        <TRow key={i}>
                                            <td className="px-4 py-2.5 text-(--text-primary)">
                                                {isGeneral ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa fa-cogs text-(--text-tertiary) text-[12px]" />
                                                        <span className="font-medium">General</span>
                                                        <span className="text-[11px] text-(--text-tertiary)">(shared settings)</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <i className="fa fa-server text-(--text-tertiary) text-[12px]" />
                                                        <span title={u.jiraUrl} className="truncate max-w-xs">{u.jiraUrl}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <ExportCheckCell
                                                show={!isGeneral}
                                                checked={exportAll || settings[u.id]?.reports || false}
                                                disabled={exportAll}
                                                onChange={(v) => setValue(v, 'reports', u)}
                                            />
                                            <ExportCheckCell
                                                show={!isGeneral}
                                                checked={exportAll || settings[u.id]?.groups || false}
                                                disabled={exportAll}
                                                onChange={(v) => setValue(v, 'groups', u)}
                                            />
                                            <ExportCheckCell
                                                show={true}
                                                checked={exportAll || settings[u.id]?.settings || false}
                                                disabled={exportAll}
                                                onChange={(v) => setValue(v, 'settings', u)}
                                            />
                                        </TRow>
                                    );
                                })}
                            </TBody>
                        </ScrollableTable>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function ExportColHeader({ title, help }: { title: string; help: string }) {
    return (
        <th
            className="px-2 py-2.5 text-center text-[12px] font-semibold uppercase tracking-wider text-(--text-secondary) bg-(--bg-secondary) border-b border-(--border-primary) w-24 whitespace-nowrap"
            title={help}
        >
            {title}
        </th>
    );
}

interface ExportCheckCellProps {
    show: boolean;
    checked: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}

function ExportCheckCell({ show, checked, disabled, onChange }: ExportCheckCellProps) {
    return (
        <td className="px-2 py-2.5">
            <div className="flex justify-center">
                {show ? (
                    <Checkbox checked={checked} disabled={disabled} onChange={(e) => onChange(e.value)} />
                ) : (
                    <span className="text-(--text-tertiary)">—</span>
                )}
            </div>
        </td>
    );
}
