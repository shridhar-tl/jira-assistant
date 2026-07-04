import { DateTimePicker } from '../../../controls/DateTimePicker';

interface LogFilterSettingsProps {
    state: any;
    setValue: (key: string, value: any) => void;
}

function LogFilterSettings({ setValue, state }: LogFilterSettingsProps) {
    const { logFilterType, filterThrsType, filterDays, filterDate, wlDateSelection } = state;

    return (
        <div className="space-y-6">
            <RadioGroup
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

            <RadioGroup
                label="Date selection"
                field="wlDateSelection"
                value={wlDateSelection}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Use updated date of worklog if modified after creation' },
                    { value: '2', label: 'Always use worklog creation date only' },
                ]}
            />

            <RadioGroup
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
                        <input
                            type="number"
                            value={filterDays}
                            min={0}
                            max={999}
                            onChange={(e) => setValue('filterDays', parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
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

interface RadioGroupProps {
    label: string;
    field: string;
    value: string;
    setValue: (key: string, value: any) => void;
    options: { value: string; label: string }[];
}

function RadioGroup({ label, field, value, setValue, options }: RadioGroupProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">{label}</label>
            <div className="space-y-1.5 flex-1">
                {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name={field}
                            checked={value === opt.value}
                            onChange={() => setValue(field, opt.value)}
                            className="accent-blue-600"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
