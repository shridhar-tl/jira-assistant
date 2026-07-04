import classNames from 'classnames';

import { DefaultWorkingDays, TINY_DAY_NAMES } from '@constants/settings';

interface WeekDaysSelectorProps {
    field: string;
    value?: number[];
    onChange: (value: number[], field: string) => void;
}

export default function WeekDaysSelector({ field, value: inputValue, onChange }: WeekDaysSelectorProps) {
    const value = inputValue || DefaultWorkingDays || [];

    const handleDaySelected = (val: number) => {
        let newValue: number[];

        if (value.includes(val)) {
            newValue = value.filter((v) => v !== val);
        } else {
            newValue = [...value, val].sort();
        }

        onChange(newValue, field);
    };

    return (
        <div className="inline-flex rounded-lg overflow-hidden border border-[--border-primary]">
            {TINY_DAY_NAMES.map((day, i) => (
                <button
                    key={day}
                    type="button"
                    className={classNames(
                        'w-10 h-10 text-sm font-medium transition-colors cursor-pointer',
                        'border-r border-[--border-primary] last:border-r-0',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
                        value.includes(i)
                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                            : 'bg-[--bg-primary] text-[--text-secondary] hover:bg-[--bg-hover]',
                    )}
                    onClick={() => handleDaySelected(i)}
                >
                    {day}
                </button>
            ))}
        </div>
    );
}
