import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './TimePicker.scss';

const defaultDisabledHours = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

const TimePicker = ({
    value,
    mode = 'number',
    className = '',
    disabled = false,
    placeholder = "Choose time",
    disabledHours = defaultDisabledHours,
    hideDisabledHours = true,
    onChange,
    field
}) => {
    const [timeValue, setTimeValue] = useState(null);
    const [isPopoverVisible, setIsPopoverVisible] = useState(false);
    const [selectedHour, setSelectedHour] = useState(null);
    const [selectedMinute, setSelectedMinute] = useState(null);
    const popoverRef = useRef();

    // Sync state with incoming props.value
    useEffect(() => {
        if (value !== undefined) {
            if (mode === "string") {
                // ToDo: Implement string mode handling if needed
                // Example: setTimeValue(moment(value, 'HH:mm'));
                // For now, it's left unimplemented as per original code
                setTimeValue(null);
            } else {
                if (value !== null && value !== undefined) {
                    const h = Math.floor(value);
                    const m = Math.round((value - h) * 60);
                    const curDate = moment().set({ hour: h, minute: m, second: 0, millisecond: 0 });
                    setTimeValue(curDate);
                    setSelectedHour(h);
                    setSelectedMinute(m);
                } else {
                    setTimeValue(null);
                    setSelectedHour(null);
                    setSelectedMinute(null);
                }
            }
        }
    }, [value, mode]);

    // Handle clicks outside the popover to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsPopoverVisible(false);
            }
        };

        if (isPopoverVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Cleanup on unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPopoverVisible]);

    // Toggle popover visibility
    const togglePopover = () => {
        if (!disabled) {
            setIsPopoverVisible((prev) => !prev);
        }
    };

    // Handle hour selection
    const handleHourSelect = (hour) => {
        setSelectedHour(hour);
        if (selectedMinute !== null) {
            updateTime(hour, selectedMinute);
        }
    };

    // Handle minute selection
    const handleMinuteSelect = (minute) => {
        setSelectedMinute(minute);
        if (selectedHour !== null) {
            updateTime(selectedHour, minute);
        }
    };

    // Update timeValue and notify parent via onChange
    const updateTime = (hour, minute) => {
        const newTime = moment().set({ hour, minute, second: 0, millisecond: 0 });
        setTimeValue(newTime);
        const newValue = hour + (minute / 60);
        if (onChange) {
            onChange(newValue, field);
        }
        setIsPopoverVisible(false);
    };

    // Display value in the input field
    const getDisplayValue = () => {
        if (timeValue) {
            return timeValue.format('HH:mm');
        }
        return '';
    };

    // Render list of hour options
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
                    className={`time-picker-option ${isDisabled ? 'disabled' : ''} ${selectedHour === h ? 'selected' : ''}`}
                    onClick={() => {
                        if (!isDisabled) {
                            handleHourSelect(h);
                        }
                    }}
                >
                    {h.toString().padStart(2, '0')}
                </div>
            );
        }
        return hours;
    };

    // Render list of minute options
    const renderMinutes = () => {
        const minutes = [];
        for (let m = 0; m < 60; m++) {
            minutes.push(
                <div
                    key={m}
                    className={`time-picker-option ${selectedMinute === m ? 'selected' : ''}`}
                    onClick={() => handleMinuteSelect(m)}
                >
                    {m.toString().padStart(2, '0')}
                </div>
            );
        }
        return minutes;
    };

    return (
        <div className={`time-picker-wrapper ${className}`} ref={popoverRef}>
            <input
                type="text"
                className="time-picker-input"
                value={getDisplayValue()}
                onClick={togglePopover}
                readOnly
                disabled={disabled}
                placeholder={placeholder}
            />
            {isPopoverVisible && (
                <div className="time-picker-popover">
                    <div className="time-picker-list hours">
                        {renderHours()}
                    </div>
                    <div className="time-picker-list minutes">
                        {renderMinutes()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimePicker;