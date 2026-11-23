import { useMemo } from 'react';

import { Button, RadioButtonGroup } from '@components';

interface ShowMoreLinkProps {
    showMore: boolean;
    setShowMore: (value: boolean) => void;
}

export function ShowMoreLink({ showMore, setShowMore }: ShowMoreLinkProps) {
    return (
        <Button
            layout="plain"
            size="sm"
            className="self-start"
            leftIcon={<i className={showMore ? 'fa fa-caret-down' : 'fa fa-caret-right'} />}
            label={showMore ? 'Hide options' : 'Show more options'}
            onClick={() => setShowMore(!showMore)}
        />
    );
}

export interface SettingsRadioOption {
    value: string;
    label: string;
    disabled?: boolean;
    warning?: string;
}

interface SettingsRadioGroupProps<TValue> {
    label: string;
    field: string;
    value: string;
    setValue: (key: string, value: TValue) => void;
    options: SettingsRadioOption[];
}

export function SettingsRadioGroup<TValue extends string>({ label, field, value, setValue, options }: SettingsRadioGroupProps<TValue>) {
    const items = useMemo(
        () =>
            options.map((opt) => ({
                value: opt.value,
                disabled: opt.disabled,
                label: opt.warning ? (
                    <span className="inline-flex items-center gap-2">
                        {opt.label}
                        <i className="fa fa-exclamation-triangle text-amber-500 text-xs" title={opt.warning} />
                    </span>
                ) : (
                    opt.label
                ),
            })),
        [options],
    );

    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <span className="text-sm font-medium text-primary sm:w-48 shrink-0 pt-1">{label}</span>
            <RadioButtonGroup
                className="flex-1"
                name={field}
                items={items}
                value={value}
                ariaLabel={label}
                onChange={(e) => setValue(field, e.value as TValue)}
            />
        </div>
    );
}
