import 'moment-timezone/builds/moment-timezone-with-data.min.js';

import { useCallback, useState } from 'react';

import { FullContext, view } from '@forge/bridge';

import { DateTimePicker } from '@/controls';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import { Button } from '@components';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';

interface ReportSettings {
    userListMode?: string;
    timeframeType?: string;
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
    };
    logFormat?: string;
    breakupMode?: string;
    userDisplayFormat?: string;
    daysToHide?: string;
    rIndicator?: string;
    expandUsers?: boolean;
    jql?: string;
    [key: string]: unknown;
}

interface ConfigModalProps {
    jiraContext: FullContext;
}

const userListModes = [
    { value: '1', label: 'All logged users' },
    { value: '2', label: 'Users from group' },
    { value: '3', label: 'From project' },
    { value: '4', label: 'From user and project' },
];

const timeframeTypes = [
    { value: '1', label: 'Sprint wise' },
    { value: '2', label: 'Date range wise' },
];

const logFormats = [
    { value: '1', label: 'Format 1 (hours)' },
    { value: '2', label: 'Format 2 (h:m)' },
    { value: '3', label: 'Format 3 (decimal)' },
];

const breakupModes = [
    { value: '1', label: 'Combine worklogs' },
    { value: '2', label: 'Show individual worklogs' },
];

const userDisplayFormats = [
    { value: '1', label: 'Display name' },
    { value: '2', label: 'Email' },
    { value: '3', label: 'Account ID' },
];

const daysToHideOptions = [
    { value: '1', label: 'Show all days' },
    { value: '2', label: 'Hide non-working days' },
    { value: '3', label: 'Hide days without worklog' },
];

const rIndicatorOptions = [
    { value: '1', label: 'Thermometer' },
    { value: '2', label: 'Background highlight' },
    { value: '0', label: 'None' },
];

function ConfigModal({ jiraContext }: ConfigModalProps) {
    const initialSettings = jiraContext?.extension?.modal?.settings || {};
    const [settings, setSettings] = useState<ReportSettings>(initialSettings);

    const setValue = useCallback((key: string, value: unknown) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const onDone = useCallback(() => {
        view.close(settings);
    }, [settings]);

    return (
        <div className="p-8 min-h-137.5 bg-white dark:bg-gray-900">
            <h3 className="text-xl font-semibold mb-4">Report Configurations</h3>

            <div className="space-y-6">
                <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <legend className="font-semibold px-2">Datasource</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField
                            label="User list mode"
                            value={settings.userListMode || '2'}
                            options={userListModes}
                            onChange={(v) => setValue('userListMode', v)}
                        />
                        <SelectField
                            label="Timeframe type"
                            value={settings.timeframeType || '2'}
                            options={timeframeTypes}
                            onChange={(v) => setValue('timeframeType', v)}
                        />
                        {settings.timeframeType === '2' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Date Range</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500">From</span>
                                        <DateTimePicker
                                            value={settings.dateRange?.fromDate ? new Date(settings.dateRange.fromDate) : undefined}
                                            onChange={(d) => setValue('dateRange', { ...settings.dateRange, fromDate: d })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500">To</span>
                                        <DateTimePicker
                                            value={settings.dateRange?.toDate ? new Date(settings.dateRange.toDate) : undefined}
                                            onChange={(d) => setValue('dateRange', { ...settings.dateRange, toDate: d })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>

                <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <legend className="font-semibold px-2">Formatting</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField
                            label="Log format"
                            value={settings.logFormat || '2'}
                            options={logFormats}
                            onChange={(v) => setValue('logFormat', v)}
                        />
                        <SelectField
                            label="Breakup mode"
                            value={settings.breakupMode || '1'}
                            options={breakupModes}
                            onChange={(v) => setValue('breakupMode', v)}
                        />
                        <SelectField
                            label="User display format"
                            value={settings.userDisplayFormat || '1'}
                            options={userDisplayFormats}
                            onChange={(v) => setValue('userDisplayFormat', v)}
                        />
                        <SelectField
                            label="Days to hide"
                            value={settings.daysToHide || '1'}
                            options={daysToHideOptions}
                            onChange={(v) => setValue('daysToHide', v)}
                        />
                        <SelectField
                            label="Remaining indicator"
                            value={settings.rIndicator || '1'}
                            options={rIndicatorOptions}
                            onChange={(v) => setValue('rIndicator', v)}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="expandUsers"
                                checked={settings.expandUsers || false}
                                onChange={(e) => setValue('expandUsers', e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="expandUsers" className="text-sm">
                                Expand users by default
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <legend className="font-semibold px-2">JQL Filter</legend>
                    <textarea
                        value={settings.jql || ''}
                        onChange={(e) => setValue('jql', e.target.value)}
                        className="w-full h-26 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Provide additional JQL filters to be applied while fetching data."
                    />
                    <span className="text-sm text-gray-500">
                        <strong>Note:</strong> Date range and user list filter will be added automatically.
                    </span>
                </fieldset>
            </div>

            <div className="flex justify-end mt-6">
                <Button leftIcon={<i className="fa fa-save" />} onClick={onDone}>
                    Done
                </Button>
            </div>
        </div>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default withInitParams(withSimpleAuth(ConfigModal));
