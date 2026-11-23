import { NumericInput } from '@components';

import { DateTimePicker } from '../../../controls/DateTimePicker';

import { SettingsRadioGroup } from './Common';

interface LogFilterSettingsProps {
    state: any;
    setValue: (key: string, value: any) => void;
}

function LogFilterSettings({ setValue, state }: LogFilterSettingsProps) {
    const { logFilterType, filterThrsType, filterDays, filterDate, wlDateSelection } = state;

    return (
        <div className="space-y-6">
            <SettingsRadioGroup
                label="Filter worklogs by creation/updation"
                field="logFilterType"
                value={logFilterType}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Show all worklogs' },
                    { value: '2', label: 'Show worklogs logged before the threshold' },
                    { value: '3', label: 'Show worklogs logged after the threshold' },
                ]}
            />

            <SettingsRadioGroup
                label="Date selection"
                field="wlDateSelection"
                value={wlDateSelection}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Use updated date of worklog if modified after creation' },
                    { value: '2', label: 'Always use worklog creation date only' },
                ]}
            />

            <SettingsRadioGroup
                label="Threshold type"
                field="filterThrsType"
                value={filterThrsType}
                setValue={setValue}
                options={[
                    { value: '1', label: 'X number of days from the log date' },
                    { value: '2', label: 'X number of days from the last date' },
                    { value: '3', label: 'On a specific date selected' },
                ]}
            />

            {filterThrsType !== '3' && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">Threshold days</label>
                    <div className="flex-1">
                        <NumericInput
                            className="w-24"
                            value={filterDays}
                            min={0}
                            max={999}
                            maxDecimals={0}
                            aria-label="Threshold days"
                            onChange={(e) => setValue('filterDays', e.value ?? 0)}
                        />
                    </div>
                </div>
            )}

            {filterThrsType === '3' && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">Threshold date</label>
                    <div className="flex-1">
                        <DateTimePicker value={filterDate} onChange={(val) => setValue('filterDate', val)} />
                    </div>
                </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm space-y-2">
                <div className="text-blue-800 dark:text-blue-300">
                    <i className="fa fa-info-circle mr-2" />
                    <strong>Info:</strong> This tab filters worklogs based on when they were created/updated. This helps eliminate or
                    identify worklogs added after a threshold date.
                </div>
                <div className="text-amber-700 dark:text-amber-400">
                    <i className="fa fa-exclamation-triangle mr-2" />
                    <strong>Note:</strong> Changes in this tab take effect only after you refresh the report.
                </div>
            </div>
        </div>
    );
}

export default LogFilterSettings;
