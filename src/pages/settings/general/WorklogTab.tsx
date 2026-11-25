import { useState } from 'react';

import config from '@/customize';

import { inject } from '@services';

import { Checkbox, RadioButtonGroup, TextInput } from '@components';

import type { WorklogMergeMode, WorklogRoundingInterval } from '@types';

import TimePicker from '@controls/TimePicker';

const { googleCalendar, outlookCalendar } = config.features.integrations;
const showMeetings = outlookCalendar !== false || googleCalendar !== false;

const defaultMergeMode: WorklogMergeMode = 'none';

const mergeModeOptions: Array<{ value: WorklogMergeMode; label: string }> = [
    { value: 'none', label: 'Do not merge worklogs and upload them as is' },
    { value: 'auto', label: 'Automatically merge worklogs on the same ticket for the same date' },
    { value: 'confirm', label: 'Confirm before merging worklogs on the same ticket for the same date' },
];

const roundingOptions: Array<{ value: string; label: string }> = [
    { value: '0', label: 'Do not round' },
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
];

const roundingHint =
    'Time spent is rounded to the closest selected interval when a worklog is uploaded, and never below one interval. For example, with 15 minutes, 23m is uploaded as 30m and 52m as 45m. Merged worklogs are rounded after merging. Bulk import uploads are not rounded.';

const suggestionHint =
    'Suggestions fill the time remaining up to your minimum daily hours and are shown only for working days up to today. When a ticket already has a worklog on that day, the remaining time is suggested as an extension of it. Available only for Jira Cloud.';

const mergeModeHints: Record<WorklogMergeMode, string> = {
    none: 'Every worklog is uploaded to Jira as a separate entry.',
    auto: 'Pending worklogs on the same ticket and date are combined into one entry starting at the earliest start time, with their time spent added up and comments joined.',
    confirm:
        'When mergeable worklogs are found during upload, a preview is shown so you can merge and upload, upload them as is, or cancel to review them first.',
};

interface WorklogTabProps {
    settings: Record<string, any>;
    isAtlasCloud?: boolean;
    onSave: (value: any, field: string) => void;
}

export default function WorklogTab({ settings, isAtlasCloud, onSave }: WorklogTabProps) {
    const saveIntSetting = (value: string, field: string) => {
        const intValue = parseInt(value);
        if (isNaN(intValue)) {
            return;
        }
        onSave(intValue, field);
    };

    const mergeMode: WorklogMergeMode = settings.worklogMergeMode || defaultMergeMode;

    return (
        <div className="divide-y divide-(--border-primary)">
            <div className="pb-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Worklog Hours Range</div>
                <p className="text-xs text-(--text-secondary) mb-3">
                    Set the minimum and maximum hours to be logged per day (HH:mm format)
                </p>
                <div className="flex gap-3 items-center flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-(--text-secondary) mb-1">Min hours</label>
                        <TimePicker
                            value={settings.minHours}
                            field="minHours"
                            onChange={(v) => onSave(v, 'minHours')}
                            placeholder="Choose min hours"
                        />
                    </div>
                    <span className="text-(--text-secondary) mt-5">to</span>
                    <div>
                        <label className="block text-xs font-medium text-(--text-secondary) mb-1">Max hours</label>
                        <TimePicker
                            value={settings.maxHours}
                            field="maxHours"
                            onChange={(v) => onSave(v, 'maxHours')}
                            placeholder="Choose max hours"
                        />
                    </div>
                </div>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Default Time Spent</div>
                <p className="text-xs text-(--text-secondary) mb-3">Default value pre-filled when adding a new worklog entry (HH:mm)</p>
                <TimePicker
                    value={settings.defaultTimeSpent || 1}
                    field="defaultTimeSpent"
                    onChange={(v) => onSave(v, 'defaultTimeSpent')}
                />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Upload Behavior</div>
                <p className="text-xs text-(--text-secondary) mb-3">Control how worklogs are uploaded to Jira</p>
                <div className="space-y-3">
                    <Checkbox
                        checked={settings.autoUpload}
                        onChange={(e) => onSave(e.value, 'autoUpload')}
                        label="Auto upload worklogs when created"
                    />
                    {isAtlasCloud && (
                        <Checkbox
                            checked={settings.notifyUsers !== false}
                            onChange={(e) => onSave(e.value, 'notifyUsers')}
                            label="Notify users watching the issue by email"
                        />
                    )}
                </div>
            </div>

            {isAtlasCloud && (
                <div className="py-5">
                    <div className="text-sm font-semibold text-(--text-primary) mb-1">Worklog Suggestions</div>
                    <p className="text-xs text-(--text-secondary) mb-3">
                        Suggest worklogs in the calendar for the time your tickets were in progress while assigned to you
                    </p>
                    <Checkbox
                        checked={settings.suggestWorklogs !== false}
                        onChange={(e) => onSave(e.value, 'suggestWorklogs')}
                        label="Show worklog suggestions in calendar"
                    />
                    <p className="flex items-start gap-2 text-xs text-(--text-tertiary) mt-3">
                        <i className="fa fa-info-circle mt-0.5" />
                        <span>{suggestionHint}</span>
                    </p>
                </div>
            )}

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Merge Worklogs</div>
                <p className="text-xs text-(--text-secondary) mb-3">
                    Combine multiple pending worklogs logged on the same ticket for the same date into a single worklog while uploading
                </p>
                <RadioButtonGroup
                    items={mergeModeOptions}
                    value={mergeMode}
                    onChange={(e) => onSave(e.value as WorklogMergeMode, 'worklogMergeMode')}
                    name="worklogMergeMode"
                    ariaLabel="Merge worklogs"
                />
                <p className="flex items-start gap-2 text-xs text-(--text-tertiary) mt-3">
                    <i className="fa fa-info-circle mt-0.5" />
                    <span>{mergeModeHints[mergeMode]} Worklogs created from meetings are never merged.</span>
                </p>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Round Time Spent</div>
                <p className="text-xs text-(--text-secondary) mb-3">Automatically round the time spent of every worklog while uploading it to Jira</p>
                <RadioButtonGroup
                    items={roundingOptions}
                    value={String(settings.worklogRoundingMins || 0)}
                    onChange={(e) => onSave(parseInt(e.value, 10) as WorklogRoundingInterval, 'worklogRoundingMins')}
                    name="worklogRoundingMins"
                    orientation="horizontal"
                    ariaLabel="Round time spent"
                />
                <p className="flex items-start gap-2 text-xs text-(--text-tertiary) mt-3">
                    <i className="fa fa-info-circle mt-0.5" />
                    <span>{roundingHint}</span>
                </p>
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Closed Tickets</div>
                <p className="text-xs text-(--text-secondary) mb-3">
                    Allow logging work on closed or resolved tickets (requires Jira server configuration)
                </p>
                <Checkbox
                    checked={settings.allowClosedTickets}
                    onChange={(e) => onSave(e.value, 'allowClosedTickets')}
                    label="Allow logging work on closed tickets"
                />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Comment Validation</div>
                <p className="text-xs text-(--text-secondary) mb-3">Set the minimum number of characters required for worklog comments</p>
                <TextInput
                    value={String(settings.commentLength ?? '')}
                    onChange={(e) => saveIntSetting(e.value, 'commentLength')}
                    type="number"
                    maxLength={3}
                    className="w-28"
                    placeholder="0"
                />
            </div>

            {showMeetings && (
                <div className="py-5">
                    <div className="text-sm font-semibold text-(--text-primary) mb-1">Meeting Ticket</div>
                    <p className="text-xs text-(--text-secondary) mb-3">Default ticket(s) for meeting worklogs, separated by commas</p>
                    <TicketNoInput value={settings.meetingTicket} field="meetingTicket" onChange={onSave} />
                </div>
            )}

            <div className="pt-5">
                <div className="text-sm font-semibold text-(--text-primary) mb-1">Worklog JQL Suffix</div>
                <p className="text-xs text-(--text-secondary) mb-3">
                    Custom JQL appended when pulling worklog issues. For Jira Cloud performance issues, try adding{' '}
                    <span className="font-mono text-xs bg-(--bg-tertiary) px-1 rounded">ORDER BY updatedDate DESC</span>
                </p>
                <TextInput
                    value={settings.worklogJQLSuffix ?? ''}
                    maxLength={150}
                    className="w-full max-w-lg"
                    onChange={(e) => onSave(e.value, 'worklogJQLSuffix')}
                    placeholder="e.g. ORDER BY updatedDate DESC"
                />
                <p className="text-xs text-(--text-tertiary) mt-2 italic">
                    Only modify this if you understand JQL and its impact on worklog fetching
                </p>
            </div>
        </div>
    );
}

interface TicketNoInputProps {
    value: string;
    field: string;
    onChange: (value: string, field: string) => void;
}

function TicketNoInput({ value: initialValue, field, onChange }: TicketNoInputProps) {
    const [value, setValue] = useState(initialValue || '');
    const { $message, $ticket } = inject('MessageService', 'TicketService');

    const handleEndEdit = async () => {
        const validatedValue = await validateTicket();
        if (typeof validatedValue === 'string') {
            onChange(validatedValue, field);
        }
    };

    const validateTicket = async (): Promise<string | false> => {
        let tickets = (value || '').trim();
        if (!tickets) {
            return '';
        }

        tickets = tickets.replace(/;/g, ',').replace(/ /g, ',');
        const ticketArray = tickets
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t);
        const formattedValue = ticketArray.join(',');
        setValue(formattedValue);

        try {
            const res = await $ticket.getTicketDetails(ticketArray);
            const list = ticketArray.map((t) => res[t.toUpperCase()] || t);
            const invalidTickets = list.filter((t) => typeof t === 'string');
            if (invalidTickets.length > 0) {
                $message.warning(`Invalid default ticket number(s) specified for meetings: ${invalidTickets.join(',')}`);
                return false;
            }
            return list.map((t: any) => t.key).join(',');
        } catch (e: any) {
            const msgs = ((e.error || {}).errorMessages || []) as string[];
            if (msgs.some((m) => m.toLowerCase().indexOf('\'key\' is invalid') > -1 || m.toLowerCase().indexOf('does not exist') > -1)) {
                $message.warning('Invalid default ticket number specified for meetings!');
            }
            return false;
        }
    };

    return (
        <TextInput
            value={value}
            maxLength={100}
            className="w-80"
            onChange={(e) => setValue(e.value)}
            onBlur={handleEndEdit}
            placeholder="e.g. PROJ-101, PROJ-102"
        />
    );
}
