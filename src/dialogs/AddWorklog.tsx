import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { startOfDay, isBefore, isAfter, isEqual, format as formatDate, parse as parseDate } from 'date-fns';

import { inject } from '@services';

import { Modal, Button, Checkbox, Dropdown, MaskedInput } from '@components';

import type { Worklog } from '@types';

import { GadgetActionType } from '../constants/gadget-actions';
import { EventCategory } from '../constants/settings';
import { DateTimePicker } from '../controls/DateTimePicker';
import { IssuePicker } from '../jira-controls/IssuePicker';

function convertHours(value?: number | string): string {
    if (!value) {
        return '01:00';
    }

    const valueStr = value.toString().split('.');
    const h = parseInt(valueStr[0]);
    const m = parseInt(Math.round(60 * parseFloat(`.${valueStr[1] || 0}`)).toString()) || 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface AdjustEstimateOption {
    value: string;
    label: string;
}

const adjustEstimateOptions: AdjustEstimateOption[] = [
    { value: '', label: 'Auto adjust' },
    { value: 'leave', label: 'No changes' },
    { value: 'manual', label: 'Reduce by' },
    { value: 'new', label: 'Set new estimate' },
];

interface AddWorklogProps {
    editTracker?: boolean;
    worklog?: Partial<Worklog>;
    uploadImmediately?: boolean;
    onHide?: (result?: any) => void;
    onDone?: (result: any) => void;
}

function getTicketNo(worklog: Partial<Worklog>): string | null {
    if (!worklog || !worklog.ticketNo) {
        return null;
    }
    return typeof worklog.ticketNo === 'string' ? worklog.ticketNo : (worklog.ticketNo as any).value;
}

function AddWorklog({ editTracker, worklog: worklogProp, uploadImmediately: uploadImmediatelyProp, onHide, onDone }: AddWorklogProps) {
    const services = useMemo(
        () => inject('SessionService', 'WorklogService', 'WorklogTimerService', 'MessageService', 'UtilsService', 'AnalyticsService'),
        [],
    );

    const { $session, $worklog, $wltimer, $message, $utils, $analytics } = services;

    const minCommentLength = useMemo(() => $session.CurrentUser.commentLength || 0, [$session]);
    const defaultTimeSpent = useMemo(() => convertHours($session.CurrentUser.defaultTimeSpent), [$session]);

    const previousTimeRef = useRef<Date | undefined>(undefined);
    const initializedRef = useRef(false);

    const [showDialog, setShowDialog] = useState(true);
    const [log, setLog] = useState<Partial<Worklog>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [uploadImmediately, setUploadImmediately] = useState(
        typeof uploadImmediatelyProp === 'boolean' ? uploadImmediatelyProp : $session.CurrentUser.autoUpload || false,
    );
    const [adjustEstimate, setAdjustEstimate] = useState('');
    const [estimate, setEstimate] = useState('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const validate = useCallback(
        (logData: Partial<Worklog>, currentAdjustEstimate?: string, currentEstimate?: string): boolean => {
            const newErrors: Record<string, boolean> = {};
            let valid = true;

            logData.timeSpent = (logData as any).overrideTimeSpent || logData.timeSpent || '00:00';
            delete (logData as any).overrideTimeSpent;

            const ticket = getTicketNo(logData);
            if (!ticket || ticket.length < 3) {
                newErrors.ticketNo = true;
                valid = false;
            }

            if (editTracker) {
                const ds = logData.dateStarted ? new Date(logData.dateStarted) : null;
                const startOfDayDate = startOfDay(new Date());
                const now = new Date();
                const isValid =
                    ds &&
                    !isNaN(ds.getTime()) &&
                    (isAfter(ds, startOfDayDate) || isEqual(ds, startOfDayDate)) &&
                    (isBefore(ds, now) || isEqual(ds, now));
                if (!isValid) {
                    newErrors.dateStarted = true;
                    valid = false;
                }
            } else {
                if (!logData.dateStarted || logData.dateStarted.toString().length < 16) {
                    newErrors.dateStarted = true;
                    valid = false;
                }

                const timeValid = !!(logData.timeSpent && logData.timeSpent.length >= 4) && $worklog.getTimeSpent(logData.timeSpent) > 0;
                if (!timeValid) {
                    newErrors.timeSpent = true;
                    valid = false;
                }

                const adjEst = currentAdjustEstimate ?? adjustEstimate;
                const est = currentEstimate ?? estimate;
                const estimateValid = (!!est && $worklog.getTimeSpent(est) > 0) || !adjEst || adjEst === 'leave';
                if (!estimateValid) {
                    newErrors.estimate = true;
                    valid = false;
                }
            }

            if (minCommentLength > 0 && (!logData.description || logData.description.length < minCommentLength)) {
                newErrors.description = true;
                valid = false;
            }

            setErrors(newErrors);
            return valid;
        },
        [editTracker, adjustEstimate, estimate, $worklog, minCommentLength],
    );

    const buildInitialLog = useCallback(
        (obj?: Partial<Worklog>): Partial<Worklog> => {
            if (!obj || obj.id) {
                return obj || {};
            }

            const now = new Date();
            const newLog: Partial<Worklog> = {
                ticketNo: obj.ticketNo,
                dateStarted: obj.startTime || obj.dateStarted || now,
                description: obj.description?.trim() || '',
            };

            if (obj.parentId) {
                newLog.parentId = obj.parentId;
            }

            let { timeSpent } = obj;
            if (typeof timeSpent === 'number') {
                timeSpent = $utils.formatSecs(timeSpent, false, true);
            }
            newLog.timeSpent = timeSpent || defaultTimeSpent;

            return newLog;
        },
        [$utils, defaultTimeSpent],
    );

    const fillWorklog = useCallback(
        async (wl: Partial<Worklog>) => {
            const d = await $worklog.getWorklog(wl);

            if (d.timeSpent) {
                d.timeSpent = d.timeSpent.substring(0, 5);
                if (d.timeSpent === '00:00') {
                    d.timeSpent = undefined;
                }
            }

            if (wl.copy) {
                $analytics?.trackEvent('Worklog copy', EventCategory.UserActions, d.isUploaded ? 'Uploaded worklog' : 'Pending worklog');
                delete d.id;
                delete d.isUploaded;
                delete d.worklogId;
                delete d.parentId;

                if (d.dateStarted) {
                    const timeStr = formatDate(d.dateStarted, 'HH:mm:ss');
                    const dateStr = formatDate(new Date(), 'yyyy/MM/dd');
                    d.dateStarted = parseDate(`${dateStr} ${timeStr}`, 'yyyy/MM/dd HH:mm:ss', new Date());
                }
            } else {
                previousTimeRef.current = d.dateStarted;
                $analytics?.trackEvent('Worklog view', EventCategory.UserActions, d.isUploaded ? 'Uploaded worklog' : 'Pending worklog');
            }

            setLog(d);
        },
        [$worklog, $analytics],
    );

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        $analytics?.trackEvent('Dialog opened', EventCategory.DialogEvents, editTracker ? 'Edit Tracker' : 'Add worklog');

        if (editTracker) {
            (async () => {
                const entry = await $wltimer.getCurrentTimer();
                if (entry) {
                    setLog({
                        ticketNo: entry.key,
                        dateStarted: new Date(entry.created),
                        description: entry.description,
                    });
                }
            })();
        } else {
            const initialLog = buildInitialLog(worklogProp);
            setLog(initialLog);

            if (initialLog.id) {
                fillWorklog(initialLog);
            }
        }
    }, [editTracker, worklogProp, $wltimer, $analytics, buildInitialLog, fillWorklog]);

    const handleHide = useCallback(() => {
        setShowDialog(false);
        onHide?.();
    }, [onHide]);

    const handleSave = useCallback(
        async (shouldUpload?: boolean | any) => {
            if (!validate(log)) {
                $message.warning('Please provide value for all the mandatory fields', 'Incomplete worklog details');
                return;
            }

            setIsLoading(true);

            if (editTracker) {
                const { dateStarted, description } = log;
                await $wltimer.editTrackerInfo(getTicketNo(log)!, dateStarted!, description!);
                onDone?.(true);
                handleHide();
            } else {
                const timeSpent = (log as any).overrideTimeSpent || log.timeSpent;

                if (adjustEstimate) {
                    shouldUpload = { adjustEstimate, estimate };
                }

                try {
                    const result = await $worklog.saveWorklog(
                        {
                            ticketNo: getTicketNo(log)!,
                            dateStarted: log.dateStarted!,
                            description: log.description!,
                            worklogId: log.worklogId,
                            isUploaded: log.isUploaded,
                            timeSpent: timeSpent!,
                            parentId: log.parentId,
                            id: log.id,
                        },
                        shouldUpload,
                    );

                    onDone?.(
                        log.id && log.id > 0
                            ? { type: GadgetActionType.WorklogModified, edited: result, previousTime: previousTimeRef.current }
                            : { type: GadgetActionType.WorklogModified, added: result },
                    );
                    handleHide();
                } catch (e: any) {
                    setIsLoading(false);
                    if (typeof e === 'string') {
                        $message.error(e);
                    } else if (e.message) {
                        $message.error(e.message);
                    }
                }
            }
        },
        [log, validate, editTracker, adjustEstimate, estimate, $wltimer, $worklog, $message, onDone, handleHide],
    );

    const handleDelete = useCallback(async () => {
        setIsLoading(true);
        const ticketNo = getTicketNo(log) || log.ticketNo;
        const deleteLog = { ...log, ticketNo };

        try {
            await $worklog.deleteWorklog(deleteLog as Worklog);
            setIsLoading(false);
            onDone?.({
                type: GadgetActionType.DeletedWorklog,
                removed: log.id,
                deleted: log.id,
                deletedObj: log,
            });
            handleHide();
        } catch {
            setIsLoading(false);
        }
    }, [log, $worklog, onDone, handleHide]);

    const updateField = useCallback((field: keyof Worklog, value: any) => {
        setLog((prev) => {
            if (value) {
                return { ...prev, [field]: value };
            }
            const next = { ...prev };
            delete (next as any)[field];
            return next;
        });
        setErrors((prev) => ({ ...prev, [field]: false }));
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter' && !isLoading) {
                handleSave(uploadImmediately && !(log.id && log.id > 0));
            }
        },
        [isLoading, handleSave, uploadImmediately, log.id],
    );

    const isEditing = !!(log.id && log.id > 0);
    const isUploaded = !!log.worklogId;
    const title = editTracker ? 'Edit Tracker' : isEditing ? 'Edit Worklog' : 'Add Worklog';

    return (
        <Modal isOpen={showDialog} onClose={handleHide} title={title} size="lg">
            <div className="flex flex-col" onKeyDown={handleKeyDown}>
                <div className="flex flex-col gap-5 p-5">
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-semibold text-primary">Ticket No</label>
                        <IssuePicker
                            value={log.ticketNo}
                            useDisplay={true}
                            className="w-full"
                            tabIndex={1}
                            placeholder="Enter the ticket number or start typing the summary"
                            disabled={!!log.isUploaded}
                            maxLength={20}
                            onPick={(val) => updateField('ticketNo', val)}
                        />
                        {errors.ticketNo && <p className="text-xs text-red-500">Please provide a valid ticket number</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-primary">Date Started</label>
                            <DateTimePicker
                                value={log.dateStarted}
                                showTime={true}
                                onChange={(val) => updateField('dateStarted', val)}
                                className="w-full"
                            />
                            {errors.dateStarted && <p className="text-xs text-red-500">Please provide a valid start date and time</p>}
                        </div>

                        {!editTracker && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-primary">Time Spent</label>
                                <MaskedInput
                                    mask="99:99"
                                    value={log.timeSpent || ''}
                                    onChange={(e) => updateField('timeSpent', e.value)}
                                    className={errors.timeSpent ? 'border-red-400' : ''}
                                />
                                {errors.timeSpent && <p className="text-xs text-red-500">Please provide valid time spent (e.g. 01:30)</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-primary">
                            Work Description
                            {minCommentLength > 0 && (
                                <span className="ml-1 font-normal text-xs text-secondary">(min {minCommentLength} chars)</span>
                            )}
                        </label>
                        <textarea
                            rows={3}
                            value={log.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Describe the work you have done..."
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-(--bg-primary) text-primary resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 ${errors.description ? 'border-red-400' : 'border-(--border-color)'}`}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500">
                                {minCommentLength > 0
                                    ? `Description must be at least ${minCommentLength} characters`
                                    : 'Please provide a work description'}
                            </p>
                        )}
                    </div>

                    {!editTracker && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-primary">Remaining Estimate</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Dropdown
                                    value={adjustEstimate || ''}
                                    options={adjustEstimateOptions}
                                    onChange={(val) => {
                                        const newVal = val.value as string;
                                        setAdjustEstimate(newVal);
                                        setErrors((prev) => ({ ...prev, estimate: false }));
                                    }}
                                />
                                {(adjustEstimate === 'manual' || adjustEstimate === 'new') && (
                                    <MaskedInput
                                        mask="99:99"
                                        value={estimate}
                                        onChange={(e) => {
                                            setEstimate(e.value);
                                            setErrors((prev) => ({ ...prev, estimate: false }));
                                        }}
                                        className={errors.estimate ? 'border-red-400' : ''}
                                    />
                                )}
                            </div>
                            {!!adjustEstimate && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Note: Worklog will be uploaded to Jira immediately upon save
                                </p>
                            )}
                            {errors.estimate && <p className="text-xs text-red-500">Please provide a valid estimate value</p>}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-(--border-color)">
                    <div className="flex items-center gap-3 mr-auto">
                        {!isEditing && (
                            <Checkbox
                                checked={uploadImmediately || !!adjustEstimate}
                                disabled={!!adjustEstimate}
                                onChange={(e) => setUploadImmediately(e.value)}
                                label="Upload immediately to Jira"
                            />
                        )}
                        {isEditing && (
                            <Button
                                variant="danger"
                                layout="outlined"
                                leftIcon={<i className="fa fa-trash" />}
                                disabled={isLoading}
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        )}
                        {isEditing && !isUploaded && (
                            <Button
                                variant="primary"
                                layout="outlined"
                                isLoading={isLoading}
                                leftIcon={<i className="fa fa-upload" />}
                                disabled={isLoading}
                                onClick={() => handleSave(true)}
                            >
                                Save &amp; Upload
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleHide}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            isLoading={isLoading}
                            disabled={isLoading}
                            onClick={() => handleSave(uploadImmediately && !isEditing)}
                        >
                            {isEditing ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default AddWorklog;
