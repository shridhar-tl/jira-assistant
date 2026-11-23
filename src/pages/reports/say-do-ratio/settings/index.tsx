import { useCallback, useState } from 'react';

import { Button, Checkbox, NumericInput, RapidViewList, type RapidView } from '@components';

import type { ReportSettings, SprintBoard } from '../types';

import Sidebar from './Sidebar';

interface ReportSettingsProps {
    settings: ReportSettings;
    show: boolean;
    onHide: () => void;
    onDone: (settings: ReportSettings) => Promise<void>;
}

function toSprintBoards(value: RapidView | RapidView[] | null): SprintBoard[] {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}

function ReportSettingsDialog({ settings: actualSettings, show, onHide, onDone }: ReportSettingsProps) {
    const [settings, updateSettings] = useState(actualSettings);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = useCallback((newSettings: Partial<ReportSettings>) => updateSettings((current) => ({ ...current, ...newSettings })), []);

    const setSprintBoards = useCallback(
        (value: RapidView | RapidView[] | null) => handleChange({ sprintBoards: toSprintBoards(value) }),
        [handleChange],
    );
    const setNumeric = useCallback((field: string, value?: number) => handleChange({ [field]: value ?? 0 }), [handleChange]);
    const setBoolean = useCallback((field: string, value: boolean) => handleChange({ [field]: !!value }), [handleChange]);

    const generateReport = useCallback(() => {
        setIsLoading(true);
        onDone(settings).finally(() => setIsLoading(false));
    }, [onDone, settings]);

    const allowGeneratingReport =
        settings?.sprintBoards?.length > 0 &&
        settings.noOfSprints >= 3 &&
        settings.noOfSprints < 13 &&
        settings.velocitySprints >= 3 &&
        !!settings.storyPointField;

    return (
        <Sidebar show={show} onHide={onHide} title="Report Config" contentClassName="p-0">
            <div className="p-4 space-y-6">
                <div>
                    <label className="block font-semibold pb-2 text-gray-800 dark:text-gray-200">Select Sprint Boards:</label>
                    <RapidViewList value={settings.sprintBoards} multiple onChange={setSprintBoards} />
                    <span className="block text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Select all the sprint boards for which you would like to view Say-Do Ratio report.
                    </span>
                </div>

                <div>
                    <label className="block font-semibold pb-2 text-gray-800 dark:text-gray-200">Number of Sprints:</label>
                    <NumericInput
                        className="w-full"
                        value={settings.noOfSprints}
                        onChange={(e) => setNumeric('noOfSprints', e.value)}
                        maxDecimals={0}
                    />
                    <span className="block text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Provide the number of sprints to be displayed in chart and table. Minimum value allowed is 3.
                    </span>
                </div>

                <div>
                    <label className="block font-semibold pb-2 text-gray-800 dark:text-gray-200">Number of Sprints for velocity:</label>
                    <NumericInput
                        className="w-full"
                        value={settings.velocitySprints}
                        onChange={(e) => setNumeric('velocitySprints', e.value)}
                        maxDecimals={0}
                    />
                    <span className="block text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Provide the number of sprints to be used for velocity calculation. The average completed story points count of all
                        the sprints would be considered as velocity of each sprint. Minimum value allowed is 3.
                    </span>
                </div>

                {!settings?.storyPointField && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                        <label className="block font-semibold text-red-600 dark:text-red-400 pb-2">Story Points field unavailable:</label>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Select value for "Story Points field" under General settings → "Default Values" tab. Report cannot be generated
                            without having "Story Points field" configured.
                        </p>
                    </div>
                )}

                <div>
                    <Checkbox
                        checked={settings.includeNonWorkingDays}
                        onChange={(e) => setBoolean('includeNonWorkingDays', e.value)}
                        label="Include non working days in cycle time calculation"
                    />
                    <div className="block text-sm text-gray-600 dark:text-gray-400 mt-2 ml-6">
                        You can configure working days from General Settings page.
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        rightIcon={<i className="fa fa-arrow-right" />}
                        label="Generate Report"
                        disabled={!allowGeneratingReport || isLoading}
                        isLoading={isLoading}
                        onClick={generateReport}
                        title="Generate report for selected boards"
                    />
                </div>
            </div>
        </Sidebar>
    );
}

export default ReportSettingsDialog;
