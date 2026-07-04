import { useState, useEffect, useRef } from 'react';

import { format, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

const defaultDisabledHours = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

interface TimePickerProps {
    value?: number | null;
    mode?: 'number' | 'string';
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    disabledHours?: number[];
    hideDisabledHours?: boolean;
    onChange?: (value: number, field?: string) => void;
    field?: string;
}

export default function TimePicker({
    value,
    mode = 'number',
    className = '',
    disabled = false,
    placeholder = 'Choose time',
    disabledHours = defaultDisabledHours,
    hideDisabledHours = true,
    onChange,
    field,
}: TimePickerProps) {
    const [timeValue, setTimeValue] = useState<Date | null>(null);
    const [isPopoverVisible, setIsPopoverVisible] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value !== undefined && value !== null) {
            if (mode === 'string') {
                setTimeValue(null);
            } else {
                const h = Math.floor(value);
                const m = Math.round((value - h) * 60);
                const curDate = setMilliseconds(setSeconds(setMinutes(setHours(new Date(), h), m), 0), 0);
                setTimeValue(curDate);
                setSelectedHour(h);
                setSelectedMinute(m);
            }
        } else {
            setTimeValue(null);
            setSelectedHour(null);
            setSelectedMinute(null);
        }
    }, [value, mode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverVisible(false);
            }
        };

        if (isPopoverVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPopoverVisible]);

    const togglePopover = () => {
        if (!disabled) {
            setIsPopoverVisible((prev) => !prev);
        }
    };

    const handleHourSelect = (hour: number) => {
        setSelectedHour(hour);
        if (selectedMinute !== null) {
            updateTime(hour, selectedMinute);
        }
    };

    const handleMinuteSelect = (minute: number) => {
        setSelectedMinute(minute);
        if (selectedHour !== null) {
            updateTime(selectedHour, minute);
        }
    };

    const updateTime = (hour: number, minute: number) => {
        const newTime = setMilliseconds(setSeconds(setMinutes(setHours(new Date(), hour), minute), 0), 0);
        setTimeValue(newTime);
        const newValue = hour + minute / 60;
        if (onChange) {
            onChange(newValue, field);
        }
        setIsPopoverVisible(false);
    };

    const getDisplayValue = () => {
        if (timeValue) {
            return format(timeValue, 'HH:mm');
        }
        return '';
    };

    const renderHours = () => {
        const hours = [];
        for (let h = 0; h < 24; h++) {
            const isDisabled = disabledHours.includes(h);
            if (hideDisabledHours && isDisabled) {
                continue;
            }
            hours.push(
                <div
                    key={h}
                    className={`px-2 py-1 cursor-pointer hover:bg-[var(--bg-hover)] ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedHour === h ? 'bg-[var(--primary-color)] text-white' : ''}`}
                    onClick={() => {
                        if (!isDisabled) {
                            handleHourSelect(h);
                        }
                    }}
                >
                    {h.toString().padStart(2, '0')}
                </div>,
            );
        }
        return hours;
    };

    const renderMinutes = () => {
        const minutes = [];
        for (let m = 0; m < 60; m++) {
            minutes.push(
                <div
                    key={m}
                    className={`px-2 py-1 cursor-pointer hover:bg-[var(--bg-hover)] ${
                        selectedMinute === m ? 'bg-[var(--primary-color)] text-white' : ''
                    }`}
                    onClick={() => handleMinuteSelect(m)}
                >
                    {m.toString().padStart(2, '0')}
                </div>,
            );
        }
        return minutes;
    };

    return (
        <div className={`relative inline-block ${className}`} ref={popoverRef}>
            <input
                type="text"
                className="border border-[var(--border-color)] rounded px-3 py-2 w-[150px] bg-[var(--bg-primary)] text-[var(--text-primary)] cursor-pointer"
                value={getDisplayValue()}
                onClick={togglePopover}
                readOnly
                disabled={disabled}
                placeholder={placeholder}
            />
            {isPopoverVisible && (
                <div className="absolute top-full left-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded shadow-lg z-50 flex">
                    <div className="overflow-y-auto max-h-[200px] border-r border-[var(--border-color)]">{renderHours()}</div>
                    <div className="overflow-y-auto max-h-[200px]">{renderMinutes()}</div>
                </div>
            )}
        </div>
    );
}
