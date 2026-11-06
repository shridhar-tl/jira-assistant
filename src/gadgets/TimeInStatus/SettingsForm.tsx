import { type ReactNode } from 'react';

import classNames from 'classnames';

import JQLEditor from '@/jira-controls/JQLEditor';

import { inject } from '@services';

import { Button, InputSwitch, NumericInput, RadioButtonGroup } from '@components';

import { SHORT_DAY_NAMES } from '@constants/settings';

import { maxDcIssueLimit, scopeModeOptions } from './constants';
import { getWorkingTimeSettings } from './settings';
import type { TimeInStatusScopeMode, TimeInStatusSettings } from './types';

interface SettingsFormProps {
    settings: TimeInStatusSettings;
    onChange: (changes: Partial<TimeInStatusSettings>) => void;
    onManageGroups?: () => void;
}

interface FieldProps {
    label: string;
    helpText?: ReactNode;
    error?: string | null;
    fullWidth?: boolean;
    children: ReactNode;
}

const groupsHint = 'Use the users icon in the gadget header to choose the users and groups for this report.';

function getWorkingTimeSummary(): string {
    const { workingDays, dayStart, dayEnd } = getWorkingTimeSettings();
    const days = [...workingDays].sort((a, b) => a - b).map((d) => SHORT_DAY_NAMES[d]);
    return `${days.join(', ')} · ${dayStart} – ${dayEnd}`;
}

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <div className="border-b border-(--border-primary) pb-1 text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">
            {children}
        </div>
    );
}

function Field({ label, helpText, error, fullWidth, children }: FieldProps) {
    return (
        <div className={classNames('flex flex-col items-start gap-1.5', { 'w-full': fullWidth })}>
            <span className="text-sm font-semibold text-(--text-primary)">{label}</span>
            {children}
            {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
            {!error && helpText && <span className="text-xs text-(--text-secondary)">{helpText}</span>}
        </div>
    );
}

function getGroupsSummary(settings: TimeInStatusSettings): string {
    const { userGroups } = settings;
    if (!userGroups) {
        return 'Your saved user groups are used.';
    }
    const userCount = new Set(userGroups.flatMap((g) => (g.users || []).map((u) => u.accountId || u.name))).size;
    return `${userGroups.length} group(s) with ${userCount} user(s) are chosen for this report.`;
}

function isDataCenter(): boolean {
    const { $session } = inject('SessionService');
    return !$session.CurrentUser?.isAtlasCloud;
}

export default function SettingsForm({ settings, onChange, onManageGroups }: SettingsFormProps) {
    const isGroupScope = settings.scopeMode === 'groups';

    return (
        <div className="flex flex-col gap-5">
            <SectionTitle>Data source</SectionTitle>
            <Field label="Issues to include">
                <RadioButtonGroup
                    items={scopeModeOptions}
                    value={settings.scopeMode}
                    onChange={(e) => onChange({ scopeMode: e.value as TimeInStatusScopeMode })}
                    orientation="horizontal"
                    ariaLabel="Issues to include"
                />
            </Field>

            <Field
                label="Users and groups"
                helpText={
                    isGroupScope
                        ? 'Issues assigned to these users are included.'
                        : 'Used when the report is grouped by user group. Assignees outside them are listed under "Other assignees".'
                }
            >
                <div className="flex flex-wrap items-center gap-2 text-sm text-(--text-primary)">
                    <span>{getGroupsSummary(settings)}</span>
                    {onManageGroups ? (
                        <Button layout="outlined" size="sm" leftIcon={<i className="fa fa-users" />} label="Manage" onClick={onManageGroups} />
                    ) : (
                        <span className="text-xs text-(--text-secondary)">{groupsHint}</span>
                    )}
                </div>
            </Field>

            <Field
                label={isGroupScope ? 'Additional JQL filter (optional)' : 'JQL to select issues'}
                helpText={isGroupScope ? 'e.g. project in (ABC, XYZ)' : 'e.g. project = ABC AND issuetype in (Story, Bug)'}
                fullWidth
            >
                <div className="w-full">
                    <JQLEditor jql={settings.jql} onChange={(jql) => onChange({ jql })} />
                </div>
            </Field>

            <SectionTitle>Time calculation</SectionTitle>
            <InputSwitch
                checked={settings.workingHoursOnly}
                onChange={(e) => onChange({ workingHoursOnly: e.value })}
                label="Count only working hours"
            />
            <p className="text-sm text-secondary">
                <strong>Note:</strong> Working days and hours are taken from <strong>Settings &rarr; General</strong> (currently{' '}
                {getWorkingTimeSummary()}) and can be customized there. Durations shown in days are counted as working days of this length.
            </p>

            {isDataCenter() && (
                <>
                    <SectionTitle>Jira Data Center</SectionTitle>
                    <Field
                        label="Confirm before fetching history of more than"
                        helpText="Jira Data Center needs a separate request for the history of each issue. You will be asked to confirm before fetching more issues than this."
                    >
                        <NumericInput
                            value={settings.dcIssueLimit}
                            onChange={(e) => onChange({ dcIssueLimit: Math.max(1, Math.floor(e.value ?? 1)) })}
                            min={1}
                            max={maxDcIssueLimit}
                            maxDecimals={0}
                            className="w-28"
                        />
                    </Field>
                </>
            )}
        </div>
    );
}
