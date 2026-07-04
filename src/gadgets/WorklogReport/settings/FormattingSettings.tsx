import { useState } from 'react';

import { Checkbox } from '@components';

import { ShowMoreLink } from './Common';

interface FormattingSettingsProps {
    state: any;
    setValue: (key: string, value: any) => void;
}

function FormattingSettings({ setValue, state }: FormattingSettingsProps) {
    const { logFormat, timeZone, daysToHide } = state;
    const [showMore, setShowMore] = useState(false);

    return (
        <div className="space-y-6">
            <RadioGroup
                label="Report timezone (experimental)"
                field="timeZone"
                value={timeZone}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Use my local time zone for all users' },
                    { value: '2', label: 'Use containing groups timezone for all users' },
                    { value: '3', label: 'Use individual users timezone' },
                ]}
            />

            <RadioGroup
                label="Days to hide in Daywise view"
                field="daysToHide"
                value={daysToHide}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Show all days' },
                    { value: '2', label: 'Hide non working days without worklog' },
                    { value: '3', label: 'Hide all days without worklog' },
                ]}
            />

            <RadioGroup
                label="Log hour format"
                field="logFormat"
                value={logFormat}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Format hours (2h 30m)' },
                    { value: '2', label: 'Show as number (2.5)' },
                ]}
            />

            <ShowMoreLink showMore={showMore} setShowMore={setShowMore} />
            {showMore && <MoreFormattingSettings setValue={setValue} state={state} />}
        </div>
    );
}

export default FormattingSettings;

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

function MoreFormattingSettings({ setValue, state }: { setValue: (key: string, value: any) => void; state: any }) {
    const { breakupMode, userDisplayFormat, rIndicator, expandUsers, splitWorklogDays } = state;

    return (
        <div className="space-y-6">
            <RadioGroup
                label="User display format"
                field="userDisplayFormat"
                value={userDisplayFormat}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Show user display name only' },
                    { value: '2', label: 'Show user display name with avatar' },
                ]}
            />

            <RadioGroup
                label="Log breakup"
                field="breakupMode"
                value={breakupMode}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Single entry (Sum worklog for same ticket on same day)' },
                    { value: '2', label: 'Individual entry (Display each worklog separately)' },
                ]}
            />

            <RadioGroup
                label="Range indicator"
                field="rIndicator"
                value={rIndicator}
                setValue={setValue}
                options={[
                    { value: '1', label: 'Show thermometer as indicator' },
                    { value: '2', label: 'Highlight background as indicator' },
                    { value: '0', label: 'Do not show any indicator' },
                ]}
            />

            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <Checkbox
                    checked={expandUsers}
                    onChange={(e) => setValue('expandUsers', e.value)}
                    label="Expand user row by default in grouped report"
                />
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={splitWorklogDays}
                        onChange={(e) => setValue('splitWorklogDays', e.value)}
                        label="Do not group worklog on ticket for multiple days under issue day wise tab"
                    />
                    <i
                        className="fa fa-exclamation-triangle text-amber-500 text-xs"
                        title="Change will take effect only after report is refreshed"
                    />
                </div>
            </div>
        </div>
    );
}
