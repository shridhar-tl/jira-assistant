import { useMemo } from 'react';

import { inject } from '@services';

import { Checkbox, Dropdown, MaskedInput } from '@components';

import { setStartOfWeek } from '@utils/helpers';

import { isWebBuild } from '@constants';
import { dateFormats, timeFormats } from '@constants/settings';

import WeekDaysSelector from './WeekDaysSelector';

const weekDaysArray = [
    { val: 0, label: 'Default' },
    { val: 1, label: 'Sunday' },
    { val: 2, label: 'Monday' },
    { val: 3, label: 'Tuesday' },
    { val: 4, label: 'Wednesday' },
    { val: 5, label: 'Thursday' },
    { val: 6, label: 'Friday' },
    { val: 7, label: 'Saturday' },
];

interface GeneralTabProps {
    settings: Record<string, any>;
    userId: number;
    noDonations?: boolean;
    onSave: (value: any, field: string) => void;
}

export default function GeneralTab({ settings, userId, noDonations, onSave }: GeneralTabProps) {
    const { $utils, $session } = inject('UtilsService', 'SessionService');

    const dateFormatOptions = useMemo(() => {
        const curDate = new Date();
        return dateFormats.map((f) => ({ format: f, text: $utils.formatDate(curDate, f) }));
    }, []);

    const timeFormatOptions = useMemo(() => {
        const curDate = new Date();
        return timeFormats.map((f) => ({ format: f, text: $utils.formatDate(curDate, f) }));
    }, []);

    const handleStartOfWeek = (value: number, field: string) => {
        const numValue = parseInt(value as any);
        onSave(numValue, field);
        setStartOfWeek(numValue);
    };

    const handleDonateMenu = (value: boolean, field: string) => {
        const cUser = $session.CurrentUser;
        cUser.hideDonateMenu = noDonations || value;
        onSave(value, field);

        if (cUser.hideDonateMenu) {
            document.body.classList.add('no-donation');
        } else {
            document.body.classList.remove('no-donation');
        }
    };

    return (
        <div className="divide-y divide-[--border-primary]">
            <div className="pb-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Date & Time Format</div>
                <p className="text-xs text-[--text-secondary] mb-3">Choose how dates and times are displayed throughout the application</p>
                <div className="flex gap-3 items-start flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Date format</label>
                        <Dropdown
                            className="w-48"
                            options={dateFormatOptions.map((f) => ({ value: f.format, label: f.text }))}
                            value={settings.dateFormat}
                            onChange={(e) => onSave(e.value, 'dateFormat')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Time format</label>
                        <Dropdown
                            className="w-44"
                            options={timeFormatOptions.map((f) => ({ value: f.format, label: f.text }))}
                            value={settings.timeFormat}
                            onChange={(e) => onSave(e.value, 'timeFormat')}
                        />
                    </div>
                </div>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Displayed Hours</div>
                <p className="text-xs text-[--text-secondary] mb-3">
                    Set the visible hours range for your calendar view (24-hour format, 00:00 to 23:00)
                </p>
                <div className="flex gap-3 items-center flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">From</label>
                        <MaskedInput
                            mask="99:99"
                            value={settings.startOfDayDisp}
                            onChange={(e) => onSave(e.value, 'startOfDayDisp')}
                            className="w-28"
                        />
                    </div>
                    <span className="text-[--text-secondary] mt-5">to</span>
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Until</label>
                        <MaskedInput
                            mask="99:99"
                            value={settings.endOfDayDisp}
                            onChange={(e) => onSave(e.value, 'endOfDayDisp')}
                            className="w-28"
                        />
                    </div>
                </div>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Working Hours</div>
                <p className="text-xs text-[--text-secondary] mb-3">Define your standard working hours range (24-hour format)</p>
                <div className="flex gap-3 items-center flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Start</label>
                        <MaskedInput
                            mask="99:99"
                            value={settings.startOfDay}
                            onChange={(e) => onSave(e.value, 'startOfDay')}
                            className="w-28"
                        />
                    </div>
                    <span className="text-[--text-secondary] mt-5">to</span>
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">End</label>
                        <MaskedInput
                            mask="99:99"
                            value={settings.endOfDay}
                            onChange={(e) => onSave(e.value, 'endOfDay')}
                            className="w-28"
                        />
                    </div>
                </div>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Working Days</div>
                <p className="text-xs text-[--text-secondary] mb-3">Select the days of the week you typically work</p>
                <WeekDaysSelector value={settings.workingDays} field="workingDays" onChange={onSave} />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Start of Week</div>
                <p className="text-xs text-[--text-secondary] mb-3">
                    Choose which day your week starts on. Default uses your locale setting
                </p>
                <Dropdown
                    options={weekDaysArray.map((d) => ({ value: d.val, label: d.label }))}
                    className="w-48"
                    value={settings.startOfWeek}
                    onChange={(e) => handleStartOfWeek(e.value, 'startOfWeek')}
                />
            </div>

            {!noDonations && (
                <div className="pt-5">
                    <div className="text-sm font-semibold text-[--text-primary] mb-1">Donate / Contribute</div>
                    <p className="text-xs text-[--text-secondary] mb-3">
                        Consider supporting the development of this tool before hiding the donate option
                    </p>
                    <div className="space-y-3">
                        <Checkbox
                            checked={settings.hideDonateMenu}
                            onChange={(e) => handleDonateMenu(e.value, 'hideDonateMenu')}
                            label="Hide Donate button in header"
                        />
                        <div>
                            <a
                                href={isWebBuild ? `/${userId}/contribute` : `/index.html#/${userId}/contribute`}
                                title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more"
                                className="inline-block hover:opacity-80 transition-opacity"
                            >
                                <img src="/assets/donate.png" width={145} alt="Donate us" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
