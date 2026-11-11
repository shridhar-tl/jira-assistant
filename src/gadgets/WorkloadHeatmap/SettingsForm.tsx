import { useEffect, useMemo, useState, type ReactNode } from 'react';

import classNames from 'classnames';

import { WeekDaysSelector } from '@/controls';

import {
    Button,
    Dropdown,
    InputSwitch,
    Multiselect,
    NumericInput,
    RadioButtonGroup,
    RapidViewList,
    SelectButton,
    TextArea,
} from '@components';
import type { RapidView } from '@components/shared/RapidViewList';

import { rangeModeOptions, scopeModeOptions } from './constants';
import { getDateFields, getFilterOptionLists, type DateFieldOption } from './data-loader';
import type { HeatmapFilterOptions, HeatmapRangeMode, HeatmapScopeMode, WorkloadHeatmapSettings } from './types';

interface SettingsFormProps {
    settings: WorkloadHeatmapSettings;
    onChange: (changes: Partial<WorkloadHeatmapSettings>) => void;
    onManageGroups?: () => void;
}

interface FieldProps {
    label: string;
    helpText?: ReactNode;
    error?: string | null;
    fullWidth?: boolean;
    children: ReactNode;
}

const emptyFilterOptions: HeatmapFilterOptions = { projects: [], issueTypes: [] };

const sprintRangeHint = 'The active sprint is shown by default. Other open sprints can be chosen from the header.';

const groupsHint = 'Use the users icon in the gadget header to choose the users and groups for this report.';

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

function getGroupsSummary(settings: WorkloadHeatmapSettings): string {
    const { userGroups } = settings;
    if (!userGroups) {
        return 'Your saved user groups are used.';
    }
    const userCount = new Set(userGroups.flatMap((g) => (g.users || []).map((u) => u.accountId || u.name))).size;
    return `${userGroups.length} group(s) with ${userCount} user(s) are chosen for this report.`;
}

export default function SettingsForm({ settings, onChange, onManageGroups }: SettingsFormProps) {
    const [dateFields, setDateFields] = useState<DateFieldOption[]>([]);
    const [loadingFields, setLoadingFields] = useState(true);
    const [filterOptions, setFilterOptions] = useState<HeatmapFilterOptions>(emptyFilterOptions);
    const [loadingFilterOptions, setLoadingFilterOptions] = useState(true);

    useEffect(() => {
        getDateFields()
            .then(setDateFields)
            .catch((err: unknown) => console.error('Failed to load date fields:', err))
            .finally(() => setLoadingFields(false));

        getFilterOptionLists()
            .then(setFilterOptions)
            .catch((err: unknown) => console.error('Failed to load projects and issue types:', err))
            .finally(() => setLoadingFilterOptions(false));
    }, []);

    const dateFieldOptions = useMemo(() => dateFields.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` })), [dateFields]);

    const isJqlScope = settings.scopeMode === 'jql';
    const isSprintRange = settings.rangeMode === 'sprint';

    const handleBoardChange = (value: RapidView | RapidView[] | null) => {
        const board = Array.isArray(value) ? value[0] || null : value;
        if (board?.id !== settings.board?.id) {
            onChange({ board: board ? { id: board.id, name: board.name } : null, sprintId: null });
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <SectionTitle>Data source</SectionTitle>
            <Field label="Issues to include">
                <RadioButtonGroup
                    items={scopeModeOptions}
                    value={settings.scopeMode}
                    onChange={(e) => onChange({ scopeMode: e.value as HeatmapScopeMode })}
                    orientation="horizontal"
                    ariaLabel="Issues to include"
                />
            </Field>

            <Field
                label="Users and groups"
                helpText={
                    isJqlScope
                        ? 'Assignees are grouped by these user groups. Assignees outside them are listed under "Other assignees".'
                        : 'Unresolved issues assigned to these users are included.'
                }
            >
                <div className="flex flex-wrap items-center gap-2 text-sm text-(--text-primary)">
                    <span>{getGroupsSummary(settings)}</span>
                    {onManageGroups ? (
                        <Button
                            layout="outlined"
                            size="sm"
                            leftIcon={<i className="fa fa-users" />}
                            label="Manage"
                            onClick={onManageGroups}
                        />
                    ) : (
                        <span className="text-xs text-(--text-secondary)">{groupsHint}</span>
                    )}
                </div>
            </Field>

            <Field
                label={isJqlScope ? 'JQL to select issues' : 'Additional JQL filter (optional)'}
                helpText={isJqlScope ? 'All assigned issues matching this JQL are included.' : 'e.g. project in (ABC, XYZ)'}
                fullWidth
            >
                <TextArea
                    value={settings.jql}
                    onChange={(e) => onChange({ jql: e.value })}
                    rows={3}
                    className="w-full font-mono text-sm"
                    placeholder={isJqlScope ? 'project = ABC AND resolution = Unresolved' : 'project in (ABC, XYZ)'}
                />
            </Field>

            <SectionTitle>Filters</SectionTitle>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Projects" fullWidth>
                    <Multiselect
                        options={filterOptions.projects}
                        value={settings.projects}
                        onChange={(e) => onChange({ projects: e.value as string[] })}
                        placeholder="All projects"
                        loading={loadingFilterOptions}
                        searchable
                        className="w-full"
                        ariaLabel="Projects"
                    />
                </Field>
                <Field label="Issue types" fullWidth>
                    <Multiselect
                        options={filterOptions.issueTypes}
                        value={settings.issueTypes}
                        onChange={(e) => onChange({ issueTypes: e.value as string[] })}
                        placeholder="All issue types"
                        loading={loadingFilterOptions}
                        searchable
                        className="w-full"
                        ariaLabel="Issue types"
                    />
                </Field>
            </div>
            <InputSwitch
                checked={settings.includeSubtasks}
                onChange={(e) => onChange({ includeSubtasks: e.value })}
                label="Include subtasks"
            />

            <SectionTitle>Period</SectionTitle>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Date range" helpText={isSprintRange ? sprintRangeHint : undefined}>
                    <SelectButton
                        items={rangeModeOptions}
                        value={settings.rangeMode}
                        onChange={(e) => onChange({ rangeMode: e.value as HeatmapRangeMode })}
                        variant="segmented"
                        ariaLabel="Date range"
                    />
                </Field>
                {isSprintRange && (
                    <Field label="Sprint board" error={settings.board ? null : 'Select the board to show its active sprint.'} fullWidth>
                        <div className="w-full">
                            <RapidViewList value={settings.board} onChange={handleBoardChange} placeholder="Search a board" />
                        </div>
                    </Field>
                )}
            </div>
            {isSprintRange && (
                <InputSwitch
                    checked={settings.sprintIssuesOnly}
                    onChange={(e) => onChange({ sprintIssuesOnly: e.value })}
                    label="Include only the issues in the sprint"
                />
            )}

            <SectionTitle>Planning</SectionTitle>
            <Field label="Work week" helpText="Estimates are spread only across these days of the week.">
                <WeekDaysSelector field="workingDays" value={settings.workingDays} onChange={(workingDays) => onChange({ workingDays })} />
            </Field>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Start date field" helpText='When not selected, the field named "Start date" is used if available.' fullWidth>
                    <Dropdown
                        options={dateFieldOptions}
                        value={settings.startDateField || undefined}
                        onChange={(e) => onChange({ startDateField: (e.value as string) || '' })}
                        placeholder="Auto detect"
                        loading={loadingFields}
                        searchable
                        showClear
                        className="w-full"
                    />
                </Field>
                <Field
                    label="Default lead time (working days)"
                    helpText="Used for issues having only a due date. Set 0 to derive it from the estimate and daily capacity."
                >
                    <NumericInput
                        value={settings.leadTimeDays}
                        onChange={(e) => onChange({ leadTimeDays: Math.max(0, Math.floor(e.value ?? 0)) })}
                        min={0}
                        max={90}
                        maxDecimals={0}
                        className="w-28"
                    />
                </Field>
            </div>
        </div>
    );
}
