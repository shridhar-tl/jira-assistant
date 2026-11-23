import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Papa from 'papaparse';

import { inject } from '@services';

import { Checkbox, Column, NoDataRow, ScrollableTable, TBody, THead, TRow } from '@components';

import { exportCsv, getErrorMessage, parseImportDate, parseTimespent, type ImportDateOrder } from '@utils';

import type { Issue } from '@types';

import { fieldMapping, wlStatusError, wlStatusExcluded, wlStatusInvalid, wlStatusWillImport } from './worklog-utils';
import WorklogActionBar from './WorklogActionBar';
import WorklogEmptyState from './WorklogEmptyState';
import WorklogPageHeader from './WorklogPageHeader';
import type { TicketSummary, WorklogRow } from './WorklogTableRow';
import WorklogTableRow from './WorklogTableRow';

import './ImportWorklog.css';

const msgTicketNotFound = 'Ticket does not exist in Jira or you do not have access to it';
const msgUploadFailed = 'Unable to upload the worklog';
const msgSaveFailed = 'Unable to save the worklog';
const msgLookupFailed = 'Unable to look up the tickets in Jira';

type RawWorklog = Record<string, string | undefined>;

function buildWorklogRow(raw: RawWorklog, order: ImportDateOrder): WorklogRow {
    const ticketNo = (raw.ticketNo || '').trim();
    const dateText = (raw.startDate || '').trim();
    const timeText = (raw.timespent || '').trim();
    const comment = (raw.comment || '').trim();
    const errors: string[] = [];
    let startDate: Date | string = dateText;
    let timespent: number | string = timeText;

    if (!ticketNo) {
        errors.push('Ticket No is required');
    }

    if (!dateText) {
        errors.push('Log Date is required');
    } else {
        const { date, ambiguous } = parseImportDate(dateText, order);
        if (date) {
            startDate = date;
        } else {
            errors.push(ambiguous ? 'Log Date is ambiguous. Select the date format of the file' : 'Log Date is invalid');
        }
    }

    if (!timeText) {
        errors.push('Timespent is required');
    } else {
        const seconds = parseTimespent(timeText);
        if (seconds > 0) {
            timespent = seconds;
        } else {
            errors.push('Timespent is invalid');
        }
    }

    const invalid = errors.length > 0;
    return {
        selected: !invalid,
        disabled: invalid,
        status: invalid ? wlStatusInvalid : wlStatusWillImport,
        error: errors.join(';'),
        ticketNo,
        startDate,
        timespent,
        comment,
    };
}

export default function ImportWorklogPage() {
    const fileSelectorRef = useRef<HTMLInputElement>(null);

    const { $utils, $userutils, $ticket, $q, $worklog, $session, $message } = useMemo(
        () => inject('UtilsService', 'UserUtilsService', 'TicketService', 'QueueService', 'WorklogService', 'SessionService', 'MessageService'),
        [],
    );

    const [worklogData, setWorklogData] = useState<WorklogRow[] | null>(null);
    const [ticketSummary, setTicketSummary] = useState<Record<string, TicketSummary>>({});
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCount, setSelectedCount] = useState<number | ''>('');
    const [autoUpload, setAutoUpload] = useState(() => $session.CurrentUser.autoUpload || false);
    const [isLoading, setIsLoading] = useState(false);
    const [dateOrder, setDateOrder] = useState<ImportDateOrder>('auto');
    const rawRowsRef = useRef<RawWorklog[] | null>(null);
    const loadIdRef = useRef(0);

    useEffect(() => {
        const uploadCompleted = () => {
            $message.info('Worklog upload completed');
            setIsLoading(false);
            setSelectedCount('');
        };
        $q.on('completed', uploadCompleted);
        return () => $q.off('completed', uploadCompleted);
    }, [$q, $message]);

    const transformHeader = useCallback((c: string) => {
        if (!c) {
            return '';
        }
        return fieldMapping[c.replace(/[ "]/g, '').toLowerCase()] || '';
    }, []);

    const getSelectedLogs = useCallback((data: WorklogRow[]) => data.filter((w) => w.selected), []);

    const processData = useCallback(
        (data: RawWorklog[], order: ImportDateOrder) => {
            const worklogData = data.map((raw) => buildWorklogRow(raw, order));

            const selectedWorklogs = getSelectedLogs(worklogData);
            const ticketList = Array.from(new Set(selectedWorklogs.map((w) => w.ticketNo)));
            const loadId = ++loadIdRef.current;

            $ticket.getTicketDetails(ticketList, true).then((list: Issue[]) => {
                if (loadId !== loadIdRef.current) {
                    return;
                }
                const summary = list.reduce(
                    (obj, { key, fields: { summary, assignee, issuetype } }) => {
                        obj[key] = { summary, assignee: assignee?.displayName, issueTypeIcon: issuetype?.iconUrl, issueType: issuetype?.name };
                        return obj;
                    },
                    {} as Record<string, TicketSummary>,
                );
                setTicketSummary(summary);

                const found = new Set(Object.keys(summary).map((key) => key.toUpperCase()));
                worklogData
                    .filter((w) => w.selected && !found.has(w.ticketNo.toUpperCase()))
                    .forEach((w) => {
                        w.selected = false;
                        w.disabled = true;
                        w.status = wlStatusInvalid;
                        w.error = msgTicketNotFound;
                    });
                setWorklogData([...worklogData]);
                setSelectedCount(getSelectedLogs(worklogData).length || '');
            }, (err: unknown) => {
                if (loadId !== loadIdRef.current) {
                    return;
                }
                const message = getErrorMessage(err, msgLookupFailed);
                $message.error(message, 'Bulk Import');
                setTicketSummary({});
                worklogData
                    .filter((w) => w.selected)
                    .forEach((w) => {
                        w.selected = false;
                        w.disabled = true;
                        w.status = wlStatusError;
                        w.error = message;
                    });
                setWorklogData([...worklogData]);
                setSelectedCount('');
            });

            const initialSummary = ticketList.reduce(
                (obj, t) => {
                    obj[t] = { summary: 'Loading...' };
                    return obj;
                },
                {} as Record<string, TicketSummary>,
            );

            setWorklogData(worklogData);
            setTicketSummary(initialSummary);
            setSelectAll(true);
            setSelectedCount(selectedWorklogs.length || '');
        },
        [getSelectedLogs, $ticket, $message],
    );

    const fileSelected = useCallback(() => {
        const selector = fileSelectorRef.current;
        if (!selector) return;

        const file = selector.files?.[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                $message.warning('Unknown file selected to import. Select a valid file to import');
                selector.value = '';
                return;
            }

            Papa.parse<RawWorklog, File>(file, {
                header: true,
                transformHeader,
                skipEmptyLines: 'greedy',
                complete: (result) => {
                    const { data } = result;
                    if (!data || !data.length) {
                        $message.warning('No rows found to import', 'No records exists');
                    }
                    rawRowsRef.current = data;
                    processData(data, dateOrder);
                },
            });
        }
        selector.value = '';
    }, [transformHeader, processData, $message, dateOrder]);

    const dateOrderChanged = useCallback(
        (order: ImportDateOrder) => {
            setDateOrder(order);
            if (rawRowsRef.current) {
                processData(rawRowsRef.current, order);
            }
        },
        [processData],
    );

    const uploadWorklog = useCallback(async (log: WorklogRow) => {
        const { ticketNo, startDate, timespent, comment } = log;

        log.status = 'Uploading...';
        setWorklogData((prev) => (prev ? [...prev] : null));

        try {
            const wlId = await $worklog.upload(ticketNo, startDate as Date, $utils.formatSecs(timespent as number), comment);
            log.disabled = true;
            log.selected = false;
            log.status = 'Uploaded';
            log.worklogId = wlId.id;
            setWorklogData((prev) => (prev ? [...prev] : null));
        } catch (err) {
            log.disabled = true;
            log.selected = false;
            log.status = wlStatusError;
            log.error = getErrorMessage(err, msgUploadFailed);
            setWorklogData((prev) => (prev ? [...prev] : null));
        }
    }, [$worklog, $utils]);

    const uploadSelectedWorklogs = useCallback(
        (selectedWorklogs: WorklogRow[]) => {
            const grouped = selectedWorklogs.reduce(
                (groups, w) => {
                    if (!groups[w.ticketNo]) groups[w.ticketNo] = [];
                    groups[w.ticketNo].push(w);
                    return groups;
                },
                {} as Record<string, WorklogRow[]>,
            );

            Object.values(grouped).forEach((wlList) => {
                $q.add(() => {
                    if (wlList.length === 1) {
                        return uploadWorklog(wlList[0]);
                    } else {
                        return wlList.reduce(async (promise, wl) => {
                            await promise;
                            return uploadWorklog(wl);
                        }, Promise.resolve());
                    }
                });
            });

            $q.start();
        },
        [$q, uploadWorklog],
    );

    const importWorklogs = useCallback(() => {
        if (!worklogData) return;

        const selectedWorklogs = worklogData.filter((w) => w.selected);

        setIsLoading(true);
        if (autoUpload) {
            uploadSelectedWorklogs(selectedWorklogs);
        } else {
            const savedWorklogs = selectedWorklogs.map((wl) => {
                wl.selected = false;
                wl.disabled = true;

                const { ticketNo, startDate, timespent, comment } = wl;
                const hour = Math.floor((timespent as number) / (60 * 60));
                const mins = Math.floor(((timespent as number) % (60 * 60)) / 60);
                const ts = `${hour.pad(2)}:${mins.pad(2)}`;

                const entry = { ticketNo, dateStarted: startDate as Date, timeSpent: ts, description: comment };

                return $worklog.saveWorklog(entry).then(
                    (s) => {
                        wl.id = parseInt(s.id) || 0;
                        wl.status = 'Imported. Not Uploaded';
                    },
                    (err: unknown) => {
                        wl.status = wlStatusError;
                        wl.error = getErrorMessage(err, msgSaveFailed);
                    },
                );
            });

            Promise.all(savedWorklogs).then(() => {
                $message.info('Worklog import completed. Upload it to Jira from Calendar or Worklog gadget.');
                setWorklogData((prev) => (prev ? [...prev] : null));
                setSelectedCount('');
                setIsLoading(false);
            });
        }
    }, [worklogData, autoUpload, uploadSelectedWorklogs, $worklog, $message]);

    const toggleAllRows = useCallback(() => {
        if (!worklogData) return;

        const newSelectAll = !selectAll;
        const status = newSelectAll ? wlStatusWillImport : wlStatusExcluded;

        const updated = worklogData.map((w) => {
            if (!w.disabled) {
                w.selected = newSelectAll;
                w.status = status;
            }
            return w;
        });

        setSelectAll(newSelectAll);
        setWorklogData(updated);
        setSelectedCount(getSelectedLogs(updated).length || '');
    }, [worklogData, selectAll, getSelectedLogs]);

    const toggleSelection = useCallback(
        (row: WorklogRow) => {
            if (!worklogData) return;

            row.selected = !row.selected;
            row.status = row.selected ? wlStatusWillImport : wlStatusExcluded;

            setWorklogData([...worklogData]);
            setSelectedCount(getSelectedLogs(worklogData).length || '');
        },
        [worklogData, getSelectedLogs],
    );

    const downloadTemplate = useCallback(() => {
        const today = new Date().format('dd-MMM-yyyy HH:mm:ss');
        const lines = [
            'Ticket No,Start Date,Timespent,Comment',
            `JA-1001,${today},1w 2d 3h 4m,Logs 59 hours and 4 mins`,
            `JA-1001,${today},1d 1h,Logs 9 hours`,
            `JA-1002,${today},12.5,Logs 12 hours and 30 mins`,
            `JA-1003,${today},14:4,Logs 14 hours and 40 mins`,
            `JA-1003,${today},8,Logs 8 hours`,
        ];
        exportCsv(lines.join('\n'), 'sample_worklog');
    }, []);

    const clearWorklogs = useCallback(() => {
        $q.reset();
        setIsLoading(false);
        setSelectedCount('');
        setWorklogData(null);
        setTicketSummary({});
        setSelectAll(false);
        rawRowsRef.current = null;
    }, [$q]);

    const formatDate = useCallback(
        (value: Date | string) => {
            if (value instanceof Date) {
                return $userutils.formatDateTime(value);
            }
            return value;
        },
        [$userutils],
    );

    const formatTimespent = useCallback(
        (value: number | string) => {
            if (typeof value === 'number') {
                return $utils.formatSecs(value);
            }
            return value;
        },
        [$utils],
    );

    return (
        <div className="bulk-import-worklog-page">
            <WorklogPageHeader
                isLoading={isLoading}
                dateOrder={dateOrder}
                onDateOrderChange={dateOrderChanged}
                onDownloadTemplate={downloadTemplate}
                onUploadClick={() => fileSelectorRef.current?.click()}
                fileSelectorProps={{ ref: fileSelectorRef, onChange: fileSelected }}
            />

            {worklogData ? (
                <div className="import-content">
                    <div className="table-container">
                        <ScrollableTable dataset={worklogData} className="w-full" height="100%">
                            <THead>
                                <TRow>
                                    <Column className="w-10 min-w-10" noExport>
                                        <Checkbox checked={selectAll} onChange={toggleAllRows} />
                                    </Column>
                                    <Column sortBy="ticketNo">Ticket No</Column>
                                    <Column>Issue Type</Column>
                                    <Column>Summary</Column>
                                    <Column sortBy="startDate">Log Date</Column>
                                    <Column sortBy="timespent">Timespent</Column>
                                    <Column>Comment</Column>
                                    <Column>Assignee</Column>
                                    <Column sortBy="status">Status</Column>
                                </TRow>
                            </THead>
                            <TBody>
                                {(row: WorklogRow, i: number) => {
                                    const rawTicket = ticketSummary[row.ticketNo] || null;
                                    const ticket = rawTicket || { summary: 'Unavailable' };

                                    return (
                                        <WorklogTableRow
                                            key={i}
                                            row={row}
                                            index={i}
                                            ticket={ticket}
                                            hasTicketInfo={!!rawTicket}
                                            ticketUrl={$userutils.getTicketUrl(row.ticketNo) || ''}
                                            worklogUrl={$userutils.getWorklogUrl(row.ticketNo, row.worklogId!)}
                                            formattedDate={formatDate(row.startDate)}
                                            formattedTimespent={formatTimespent(row.timespent)}
                                            onToggle={() => toggleSelection(row)}
                                        />
                                    );
                                }}
                            </TBody>
                            <NoDataRow span={9}>
                                Upload the list of worklogs by clicking the (<i className="fa fa-upload" />) icon in top right corner. Click{' '}
                                <span className="text-blue-600 cursor-pointer hover:underline" onClick={downloadTemplate}>
                                    here
                                </span>{' '}
                                to download a sample template.
                            </NoDataRow>
                        </ScrollableTable>
                    </div>

                    <WorklogActionBar
                        autoUpload={autoUpload}
                        isLoading={isLoading}
                        selectedCount={selectedCount}
                        onAutoUploadChange={setAutoUpload}
                        onClear={clearWorklogs}
                        onImport={importWorklogs}
                    />
                </div>
            ) : (
                <div className="empty-state-wrapper">
                    <WorklogEmptyState onDownloadTemplate={downloadTemplate} onUploadClick={() => fileSelectorRef.current?.click()} />
                </div>
            )}
        </div>
    );
}
