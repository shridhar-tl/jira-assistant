import React, { useCallback, useMemo } from 'react';

import { AutocompleteMulti } from 'fluxo-ui';

import { Button, RadioButton, TextInput } from '@components';

import HowToUseSection from './HowToUseSection';
import type { DateRange, ProjectItem } from './types';

const storyPointEnableHelp =
    'Select an appropriate field for story point in Settings -> General -> Default values tab -> Story point field to enable this option.';

interface SettingsPanelProps {
    groups: any[];
    dateRange: DateRange;
    projects: ProjectItem[];
    projectsList: ProjectItem[];
    ticketsList: string;
    estimationField: string;
    storyPointField: string | undefined;
    storyPointHour: number | null;
    disableGenerate: boolean;
    onShowGroups: () => void;
    onDateChange: (range: DateRange) => void;
    onProjectsChange: (projects: ProjectItem[]) => void;
    onTicketsChange: (tickets: string) => void;
    onEstimationFieldChange: (field: string) => void;
    onStoryPointHourChange: (hours: number | null) => void;
    onGenerate: () => void;
    onProjectFilter: (query: string) => void;
}

function formatDateValue(date?: Date): string {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function SettingsPanel({
    groups,
    dateRange,
    projects,
    projectsList,
    ticketsList,
    estimationField,
    storyPointField,
    storyPointHour,
    disableGenerate,
    onShowGroups,
    onDateChange,
    onProjectsChange,
    onTicketsChange,
    onEstimationFieldChange,
    onStoryPointHourChange,
    onGenerate,
    onProjectFilter,
}: SettingsPanelProps) {
    const handleFromDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            onDateChange({ ...dateRange, fromDate: value ? new Date(value) : undefined });
        },
        [dateRange, onDateChange],
    );

    const handleToDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            onDateChange({ ...dateRange, toDate: value ? new Date(value) : undefined });
        },
        [dateRange, onDateChange],
    );

    const fromDateStr = useMemo(() => formatDateValue(dateRange.fromDate), [dateRange.fromDate]);
    const toDateStr = useMemo(() => formatDateValue(dateRange.toDate), [dateRange.toDate]);

    const isStoryPointSelected = estimationField === storyPointField;

    const projectItems = useMemo(() => projectsList.map((p) => ({ value: p, label: p.name })), [projectsList]);

    const selectedProjectItems = useMemo(() => (projects || []).map((p) => ({ value: p, label: p.name })), [projects]);

    const totalUsers = useMemo(() => groups.reduce((sum, g) => sum + (g.users?.length || 0), 0), [groups]);

    return (
        <div className="p-5 max-w-6xl mx-auto space-y-6">
            <HowToUseSection />

            <div className="bg-(--bg-secondary) rounded-xl border border-(--border-color) p-5 space-y-5">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Report Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="User List" required>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                                    bg-blue-50 text-blue-700 border border-blue-200
                                    hover:bg-blue-100 hover:border-blue-300
                                    dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800
                                    dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                                onClick={onShowGroups}
                            >
                                <i className="fa fa-users text-xs" />
                                Add / remove users
                            </button>
                            {groups.length > 0 && (
                                <span
                                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full
                                    bg-green-50 text-green-700 border border-green-200
                                    dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
                                >
                                    {groups.length} group{groups.length !== 1 ? 's' : ''} ({totalUsers} user{totalUsers !== 1 ? 's' : ''})
                                </span>
                            )}
                        </div>
                    </FieldGroup>

                    <FieldGroup label="Date Range" required>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={fromDateStr}
                                onChange={handleFromDateChange}
                                className="flex-1 px-3 py-2 text-sm border border-(--border-color) rounded-lg
                                    bg-(--bg-primary) text-primary
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                                    transition-shadow"
                            />
                            <span className="text-xs font-medium text-secondary px-1">to</span>
                            <input
                                type="date"
                                value={toDateStr}
                                onChange={handleToDateChange}
                                className="flex-1 px-3 py-2 text-sm border border-(--border-color) rounded-lg
                                    bg-(--bg-primary) text-primary
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                                    transition-shadow"
                            />
                        </div>
                    </FieldGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Projects" hint="Filter by project(s)">
                        <AutocompleteMulti
                            items={projectItems}
                            value={selectedProjectItems.map((p) => p.value)}
                            onChange={(e: any) => onProjectsChange(e.value || [])}
                            onFilter={(query: string) => onProjectFilter(query)}
                            placeholder="Search and select projects..."
                            size="sm"
                        />
                    </FieldGroup>

                    <FieldGroup label="Tickets List" hint="Comma-separated ticket keys">
                        <TextInput
                            value={ticketsList}
                            onChange={(e: any) => onTicketsChange(e.value)}
                            placeholder="e.g. PROJ-101, PROJ-205, PROJ-310"
                            size="sm"
                        />
                    </FieldGroup>
                </div>
            </div>

            <div className="bg-(--bg-secondary) rounded-xl border border-(--border-color) p-5 space-y-5">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Estimation Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Estimate Type" required>
                        <div className="flex items-center gap-5 pt-1">
                            <RadioButton
                                name="estimateType"
                                checked={estimationField === 'timeoriginalestimate'}
                                onChange={() => onEstimationFieldChange('timeoriginalestimate')}
                                label="Time estimate"
                            />
                            <div className="flex items-center gap-1.5">
                                <RadioButton
                                    name="estimateType"
                                    checked={isStoryPointSelected}
                                    onChange={() => {
                                        if (storyPointField) onEstimationFieldChange(storyPointField);
                                    }}
                                    label="Story Point"
                                    disabled={!storyPointField}
                                    title={storyPointField ? '' : storyPointEnableHelp}
                                />
                                {!storyPointField && (
                                    <i className="fa fa-question-circle text-amber-500 text-sm cursor-help" title={storyPointEnableHelp} />
                                )}
                            </div>
                        </div>
                    </FieldGroup>

                    {isStoryPointSelected && (
                        <FieldGroup label="Hours per Story Point" hint="Convert story points to hours">
                            <TextInput
                                value={storyPointHour?.toString() || ''}
                                onChange={(e: any) => {
                                    const val = e.value;
                                    onStoryPointHourChange(val ? parseFloat(val) : null);
                                }}
                                maxLength={5}
                                placeholder="e.g. 8"
                                size="sm"
                            />
                        </FieldGroup>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    variant="primary"
                    disabled={disableGenerate}
                    leftIcon={<i className="fa fa-play-circle" />}
                    label="Generate Report"
                    onClick={onGenerate}
                    size="md"
                />
            </div>
        </div>
    );
}

function FieldGroup({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
                <label className="text-sm font-semibold text-primary">
                    {required && <span className="text-red-500 mr-0.5">*</span>}
                    {label}
                </label>
                {hint && <span className="text-xs text-secondary">({hint})</span>}
            </div>
            {children}
        </div>
    );
}
