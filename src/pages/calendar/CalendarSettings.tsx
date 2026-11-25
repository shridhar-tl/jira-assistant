import { useState, type ReactNode } from 'react';

import { ColorPicker } from '@/controls';

import { Button, Checkbox, Modal, RadioButtonGroup } from '@components';

import { sett_page_calendar } from '@constants/settings';

import type { CalendarSettings as CalendarSettingsType } from './types';

interface CalendarSettingsProps {
    settings: CalendarSettingsType;
    showSuggestionColor: boolean;
    onDone: (settings: CalendarSettingsType) => void;
    onHide: () => void;
}

interface ColorField {
    field: keyof CalendarSettingsType;
    label: string;
    hint: string;
    onlyForSuggestions?: boolean;
}

interface ToggleField {
    field: keyof CalendarSettingsType;
    label: string;
    hint: string;
    warning?: string;
}

const detailsModeOptions = [
    { value: '1', label: 'Show worklog comments' },
    { value: '2', label: 'Show ticket summary' },
    { value: '3', label: 'Show both (when space allows)' },
];

const entryColorFields: ColorField[] = [
    { field: 'eventColor', label: 'Meeting entry', hint: 'Color used for calendar meeting entries' },
    { field: 'worklogColor', label: 'Worklog entry', hint: 'Color used for worklog entries' },
    {
        field: 'suggestionColor',
        label: 'Worklog suggestion',
        hint: 'Color used for suggested worklogs and their daily summary',
        onlyForSuggestions: true,
    },
];

const summaryColorFields: ColorField[] = [
    { field: 'infoColor_valid', label: 'On target', hint: 'Hours logged equals the daily target' },
    { field: 'infoColor_less', label: 'Under logged', hint: 'Hours logged is less than the daily target' },
    { field: 'infoColor_high', label: 'Over logged', hint: 'Hours logged exceeds the daily target' },
];

const visibleEntryFields: ToggleField[] = [
    { field: 'showMeetings', label: 'Calendar meetings', hint: 'Show entries for meetings integrated from your calendar' },
    { field: 'showWorklogs', label: 'My worklogs', hint: 'Show worklog entries added by you' },
    { field: 'showInfo', label: 'Daily summary', hint: 'Show daily total hours logged as an info entry' },
];

const displayFields: ToggleField[] = [
    { field: 'glassyEntries', label: 'Glass style entries', hint: 'Show entries as clear glass with the entry color as a dot' },
    { field: 'rowBanding', label: 'Alternate row colors', hint: 'Enable banded row coloring on the calendar time grid' },
    {
        field: 'hideWeekends',
        label: 'Hide weekends',
        hint: 'Hide weekends from the calendar view',
        warning: 'Applies after page refresh. Pending worklogs for hidden days will still be uploaded.',
    },
    {
        field: 'readableEvents',
        label: 'Expand small events',
        hint: 'Allow short events to expand in height for readability',
        warning: 'May cause small events to overlap. Applies after page refresh.',
    },
];

const resettableFields: (keyof CalendarSettingsType)[] = [
    ...[...entryColorFields, ...summaryColorFields, ...visibleEntryFields, ...displayFields].map(({ field }) => field),
    'detailsMode',
];

const defaultSettings = Object.fromEntries(
    resettableFields.filter((field) => field in sett_page_calendar).map((field) => [field, sett_page_calendar[field as keyof typeof sett_page_calendar]]),
) as Partial<CalendarSettingsType>;

function getResetSettings(current: CalendarSettingsType): CalendarSettingsType {
    const settings = { ...current };
    resettableFields.forEach((field) => delete settings[field]);
    return { ...settings, ...defaultSettings };
}

const cardClassName = 'rounded-lg border border-(--border-primary) divide-y divide-(--border-primary) overflow-hidden';

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-1.5 mt-3 first:mt-0">
            <span className={`fa ${icon} text-[11px] text-(--color-primary)`} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-(--text-secondary)">{title}</h3>
        </div>
    );
}

export default function CalendarSettings({ settings: initialSettings, showSuggestionColor, onDone, onHide }: CalendarSettingsProps) {
    const [settings, setSettings] = useState<CalendarSettingsType>({ ...initialSettings });

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

    const colorRows = (fields: ColorField[]) => (
        <div className={cardClassName}>
            {fields
                .filter((f) => !f.onlyForSuggestions || showSuggestionColor)
                .map(({ field, label, hint }) => (
                    <div key={field} className="cal-color-row flex items-center justify-between gap-3 px-3 py-1.5 bg-(--bg-primary)" title={hint}>
                        <span className="text-[13px] text-(--text-primary) whitespace-nowrap">{label}</span>
                        <div className="shrink-0">
                            <ColorPicker
                                size="sm"
                                value={settings[field] as string | undefined}
                                fieldName={field}
                                onChange={setValue as (value: string, field: string) => void}
                            />
                        </div>
                    </div>
                ))}
        </div>
    );

    const toggleRows = (fields: ToggleField[]): ReactNode => (
        <div className={cardClassName}>
            {fields.map(({ field, label, hint, warning }) => (
                <label
                    key={field}
                    className="flex items-center gap-2.5 px-3 py-2 bg-(--bg-primary) hover:bg-(--bg-secondary) transition-colors cursor-pointer"
                    title={hint}
                >
                    <Checkbox checked={(settings[field] as boolean) || false} onChange={(val) => setValue(val.value, field)} />
                    <span className="text-[13px] text-(--text-primary)">{label}</span>
                    {warning && <span className="fa fa-exclamation-triangle text-yellow-500 text-[11px]" title={warning} />}
                </label>
            ))}
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title="Calendar Settings" size="lg">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2">
                    <section>
                        <SectionHeader icon="fa-paint-brush" title="Entry Colors" />
                        {colorRows(entryColorFields)}
                        <SectionHeader icon="fa-calendar-check" title="Daily Summary Colors" />
                        {colorRows(summaryColorFields)}
                    </section>

                    <section>
                        <SectionHeader icon="fa-eye" title="Visible Entries" />
                        {toggleRows(visibleEntryFields)}
                        <SectionHeader icon="fa-align-left" title="Worklog Entry Detail" />
                        <div className="rounded-lg border border-(--border-primary) px-3 py-2 bg-(--bg-primary) text-[13px]">
                            <RadioButtonGroup
                                items={detailsModeOptions}
                                value={settings.detailsMode || '1'}
                                onChange={(val) => setValue(val.value, 'detailsMode')}
                                orientation="vertical"
                                size="sm"
                            />
                        </div>
                        <SectionHeader icon="fa-sliders" title="Display Options" />
                        {toggleRows(displayFields)}
                    </section>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-(--border-primary)">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mr-auto"
                        leftIcon={<i className="fa fa-undo text-xs" />}
                        title="Restore the default colors and options of this dialog. Click Save settings to apply."
                        onClick={() => setSettings(getResetSettings)}
                    >
                        Reset to defaults
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleDone}>
                        Save settings
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
