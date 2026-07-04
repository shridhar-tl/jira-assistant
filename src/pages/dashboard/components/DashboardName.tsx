import { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput } from '@components';

import { DASHBOARD_ICONS } from '@constants';

interface DashboardNameProps {
    value?: string;
    icon?: string;
    onChange: (name: string, icon: string) => void;
}

export function DashboardName({ value: propValue, icon: propIcon, onChange }: DashboardNameProps) {
    const [value, setValue] = useState(propValue || 'Default');
    const [icon, setIcon] = useState(propIcon || 'fa-tachometer');
    const [isEditMode, setIsEditMode] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setValue(propValue || 'Default');
        setIcon(propIcon || 'fa-tachometer');
    }, [propValue, propIcon]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setShowIconPicker(false);
            }
        };

        if (showIconPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showIconPicker]);

    const saveName = () => {
        setIsEditMode(false);
        setShowIconPicker(false);
        onChange(value, icon);
    };

    const cancelEdit = () => {
        setIsEditMode(false);
        setShowIconPicker(false);
        setValue(propValue || 'Default');
        setIcon(propIcon || 'fa-tachometer');
    };

    const handleIconClick = (selectedIcon: string) => {
        setIcon(selectedIcon);
        setShowIconPicker(false);
    };

    if (isEditMode) {
        return (
            <div className="relative flex items-center gap-1.5">
                <div className="relative">
                    <Button
                        leftIcon={<i className={`fa ${icon}`} />}
                        layout="outlined"
                        title="Change icon"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        size="sm"
                    />
                    {showIconPicker && (
                        <div
                            ref={iconPickerRef}
                            className="absolute top-full left-0 mt-1.5 w-72 bg-(--bg-primary) border border-(--border-primary) rounded-lg shadow-xl p-2 z-50"
                        >
                            <p className="text-xs text-(--text-secondary) px-1 pb-1.5 font-medium">Choose icon</p>
                            <div className="grid grid-cols-6 gap-0.5 max-h-48 overflow-y-auto overflow-x-hidden">
                                {DASHBOARD_ICONS.map((dashIcon: string, i: number) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={classNames(
                                            'flex items-center justify-center w-8 h-8 cursor-pointer rounded transition-colors',
                                            dashIcon === icon
                                                ? 'bg-(--bg-active) text-(--text-link)'
                                                : 'hover:bg-(--bg-hover) text-(--text-primary)',
                                        )}
                                        onClick={() => handleIconClick(dashIcon)}
                                        title={dashIcon.replace('fa-', '')}
                                    >
                                        <span className={classNames('fa', dashIcon, 'text-base')} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <TextInput value={value} onChange={(e: any) => setValue(e.target.value)} maxLength={18} size="sm" />
                <Button
                    leftIcon={<i className="fa fa-check" />}
                    variant="success"
                    layout="outlined"
                    size="sm"
                    onClick={saveName}
                    disabled={!value || value.length <= 2}
                    title="Save"
                />
                <Button leftIcon={<i className="fa fa-times" />} layout="outlined" size="sm" onClick={cancelEdit} title="Cancel" />
            </div>
        );
    }

    return (
        <button
            type="button"
            className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-(--bg-hover) transition-colors cursor-pointer"
            title="Click to rename or change the icon"
            onClick={() => setIsEditMode(true)}
        >
            <span className={classNames('fa', icon, 'text-base text-(--text-link)')} />
            <span className="text-sm font-medium text-(--text-secondary)">Dashboards</span>
            <i className="fa fa-chevron-right text-[10px] text-(--text-muted)" />
            <span className="text-sm font-semibold text-(--text-primary)">{value}</span>
            <i className="fa fa-pencil text-[10px] text-(--text-muted) opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
        </button>
    );
}
