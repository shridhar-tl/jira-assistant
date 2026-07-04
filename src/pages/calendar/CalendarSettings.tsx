import { useState, type ReactNode } from 'react';

import { ColorPicker } from '@/controls';

import { Button, Checkbox, Modal, RadioButtonGroup } from '@components';

import type { CalendarSettings as CalendarSettingsType } from './types';

interface CalendarSettingsProps {
    settings: CalendarSettingsType;
    onDone: (settings: CalendarSettingsType) => void;
    onHide: () => void;
}

const detailsModeOptions = [
    { value: '1', label: 'Show worklog comments' },
    { value: '2', label: 'Show ticket summary' },
    { value: '3', label: 'Show both (when space allows)' },
];

const colorFields: Array<{
    field: keyof CalendarSettingsType;
    label: string;
    hint: string;
    onlyForMeetings?: boolean;
}> = [
    {
        field: 'eventColor',
        label: 'Meeting entry',
        hint: 'Color used for calendar meeting entries',
        onlyForMeetings: true,
    },
    {
        field: 'worklogColor',
        label: 'Worklog entry',
        hint: 'Color used for worklog entries',
    },
    {
        field: 'infoColor_valid',
        label: 'Info — On target',
        hint: 'Hours logged equals the daily target',
    },
    {
        field: 'infoColor_less',
        label: 'Info — Under logged',
        hint: 'Hours logged is less than the daily target',
    },
    {
        field: 'infoColor_high',
        label: 'Info — Over logged',
        hint: 'Hours logged exceeds the daily target',
    },
];

export default function CalendarSettings({ settings: initialSettings, onDone, onHide }: CalendarSettingsProps) {
    const [settings, setSettings] = useState<CalendarSettingsType>({ ...initialSettings });

    const showMeetingsSection = true;

    const setValue = (value: string | boolean, field: keyof CalendarSettingsType) => {
        setSettings((prev) => {
            const newSettings = { ...prev };
            if (value || value === false) {
                (newSettings[field] as string | boolean) = value;
            } else {
                delete newSettings[field];
            }
            return newSettings;
        });
    };

    const handleDone = () => {
        onDone(settings);
        onHide();
    };

    const visibleColorFields = colorFields.filter((f) => !f.onlyForMeetings || showMeetingsSection);

    const borderStyle = { borderColor: 'var(--border-primary)' };

    const sectionHeader = (icon: string, title: string) => (
        <div className="flex items-center gap-2 mb-3">
            <span className={`fa ${icon} text-[--color-primary]`} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--text-secondary]">{title}</h3>
        </div>
    );

    const toggleRow = (
        label: string,
        hint: ReactNode,
        field: keyof CalendarSettingsType,
        withBorder: boolean,
    ) => (
        <label
            className="flex items-start gap-3 px-4 py-3 bg-[--bg-primary] hover:bg-[--bg-secondary] transition-colors cursor-pointer"
            style={withBorder ? { borderTop: '1px solid var(--border-primary)' } : undefined}
        >
            <Checkbox
                checked={(settings[field] as boolean) || false}
                onChange={(val) => setValue(val.value, field)}
            />
            <div>
                <span className="text-sm font-medium text-[--text-primary]">{label}</span>
                <p className="text-xs text-[--text-secondary] mt-0.5">{hint}</p>
            </div>
        </label>
    );

    return (
        <Modal isOpen onClose={onHide} title="Calendar Settings" size="xl">
            <div className="flex flex-col gap-6 p-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Column 1: Colors (tall) */}
                    <section className="lg:row-span-2">
                        {sectionHeader('fa-paint-brush', 'Entry Colors')}
                        <div className="rounded-xl overflow-hidden border" style={borderStyle}>
                            {visibleColorFields.map(({ field, label, hint }, idx) => (
                                <div
                                    key={field}
                                    className="flex flex-col gap-2 px-4 py-3 bg-[--bg-primary] hover:bg-[--bg-secondary] transition-colors"
                                    style={idx > 0 ? { borderTop: '1px solid var(--border-primary)' } : undefined}
                                >
                                    <div>
                                        <span className="text-sm font-medium text-[--text-primary]">{label}</span>
                                        <p className="text-xs text-[--text-secondary] mt-0.5">{hint}</p>
                                    </div>
                                    <ColorPicker
                                        value={settings[field] as string | undefined}
                                        fieldName={field}
                                        onChange={setValue as (value: string, field: string) => void}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Column 2: Visible Entries */}
                    <section>
                        {sectionHeader('fa-eye', 'Visible Entries')}
                        <div className="rounded-xl overflow-hidden border" style={borderStyle}>
                            {showMeetingsSection && toggleRow(
                                'Calendar meetings',
                                'Show entries for meetings integrated from your calendar',
                                'showMeetings',
                                false,
                            )}
                            {toggleRow(
                                'My worklogs',
                                'Show worklog entries added by you',
                                'showWorklogs',
                                showMeetingsSection,
                            )}
                            {toggleRow(
                                'Daily summary',
                                'Show daily total hours logged as an info entry',
                                'showInfo',
                                true,
                            )}
                        </div>
                    </section>

                    {/* Column 2: Detail Mode */}
                    <section>
                        {sectionHeader('fa-align-left', 'Worklog Entry Detail')}
                        <div className="rounded-xl overflow-hidden border px-4 py-3 bg-[--bg-primary]" style={borderStyle}>
                            <RadioButtonGroup
                                items={detailsModeOptions}
                                value={settings.detailsMode || '1'}
                                onChange={(val) => setValue(val.value, 'detailsMode')}
                                orientation="vertical"
                            />
                        </div>
                    </section>

                    {/* Full-width: Display Options */}
                    <section className="lg:col-span-2">
                        {sectionHeader('fa-sliders', 'Display Options')}
                        <div className="rounded-xl overflow-hidden border grid grid-cols-1 md:grid-cols-3" style={borderStyle}>
                            <label className="flex items-start gap-3 px-4 py-3 bg-[--bg-primary] hover:bg-[--bg-secondary] transition-colors cursor-pointer md:border-r" style={{ borderColor: 'var(--border-primary)' }}>
                                <Checkbox checked={settings.rowBanding || false} onChange={(val) => setValue(val.value, 'rowBanding')} />
                                <div>
                                    <span className="text-sm font-medium text-[--text-primary]">Alternate row colors</span>
                                    <p className="text-xs text-[--text-secondary] mt-0.5">
                                        Enable banded row coloring on the calendar time grid
                                    </p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 px-4 py-3 bg-[--bg-primary] hover:bg-[--bg-secondary] transition-colors cursor-pointer md:border-r border-t md:border-t-0" style={{ borderColor: 'var(--border-primary)' }}>
                                <Checkbox checked={settings.hideWeekends || false} onChange={(val) => setValue(val.value, 'hideWeekends')} />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-[--text-primary]">Hide weekends</span>
                                        <span
                                            className="fa fa-exclamation-triangle text-yellow-500 text-xs"
                                            title="Applies after page refresh. Pending worklogs for hidden days will still be uploaded."
                                        />
                                    </div>
                                    <p className="text-xs text-[--text-secondary] mt-0.5">Hide weekends from the calendar view</p>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 px-4 py-3 bg-[--bg-primary] hover:bg-[--bg-secondary] transition-colors cursor-pointer border-t md:border-t-0" style={{ borderColor: 'var(--border-primary)' }}>
                                <Checkbox
                                    checked={settings.readableEvents || false}
                                    onChange={(val) => setValue(val.value, 'readableEvents')}
                                />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium text-[--text-primary]">Expand small events</span>
                                        <span
                                            className="fa fa-exclamation-triangle text-yellow-500 text-xs"
                                            title="May cause small events to overlap. Applies after page refresh."
                                        />
                                    </div>
                                    <p className="text-xs text-[--text-secondary] mt-0.5">Allow short events to expand in height for readability</p>
                                </div>
                            </label>
                        </div>
                    </section>
                </div>

                {/* Footer actions */}
                <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <Button variant="secondary" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleDone}>
                        Save settings
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
