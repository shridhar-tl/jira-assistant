import { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { Button, TextInput, type ComponentEvent } from '@components';

import { DASHBOARD_ICONS, dashboardIconClass, defaultDashboardIcon } from '@constants';

interface DashboardNameProps {
    value?: string;
    icon?: string;
    onChange: (name: string, icon: string) => void;
}

export function DashboardName({ value: propValue, icon: propIcon, onChange }: DashboardNameProps) {
    const [value, setValue] = useState(propValue || 'Default');
    const [icon, setIcon] = useState(propIcon || defaultDashboardIcon);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setValue(propValue || 'Default');
        setIcon(propIcon || defaultDashboardIcon);
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
        setIcon(propIcon || defaultDashboardIcon);
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
                        leftIcon={<i className={dashboardIconClass(icon)} />}
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
                                {DASHBOARD_ICONS.map(({ icon: dashIcon, label }) => (
                                    <Button
                                        key={dashIcon}
                                        layout="plain"
                                        size="sm"
                                        leftIcon={<i className={classNames(dashIcon, 'text-base')} />}
                                        className={classNames('w-8 h-8', {
                                            'bg-(--bg-active)! text-(--text-link)!': dashIcon === icon,
                                        })}
                                        title={label}
                                        ariaLabel={label}
                                        aria-pressed={dashIcon === icon}
                                        onClick={() => handleIconClick(dashIcon)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <TextInput value={value} onChange={({ value }: ComponentEvent<string>) => setValue(value)} maxLength={18} size="sm" />
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
            <span className={classNames(dashboardIconClass(icon), 'text-base text-(--text-link)')} />
            <span className="text-sm font-medium text-(--text-secondary)">Dashboards</span>
            <i className="fa fa-chevron-right text-[10px] text-(--text-muted)" />
            <span className="text-sm font-semibold text-(--text-primary)">{value}</span>
            <i className="fa fa-pencil text-[10px] text-(--text-muted) opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
        </button>
    );
}
