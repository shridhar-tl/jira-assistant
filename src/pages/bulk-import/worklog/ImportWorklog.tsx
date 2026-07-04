import { useCallback, useEffect, useRef, useState } from 'react';

import Papa from 'papaparse';

import { inject } from '@services';

import { Checkbox, Column, NoDataRow, ScrollableTable, TBody, THead, TRow } from '@components';

import { exportCsv, parseTimespent } from '@utils';

import { fieldMapping, wlStatusError, wlStatusExcluded, wlStatusInvalid, wlStatusWillImport } from './worklog-utils';
import WorklogActionBar from './WorklogActionBar';
import WorklogEmptyState from './WorklogEmptyState';
import WorklogPageHeader from './WorklogPageHeader';
import type { TicketSummary, WorklogRow } from './WorklogTableRow';
import WorklogTableRow from './WorklogTableRow';

import './ImportWorklog.css';

export default function ImportWorklogPage() {
    const fileSelectorRef = useRef<HTMLInputElement>(null);

    const { $utils, $userutils, $ticket, $q, $worklog, $session, $message } = inject(
        'UtilsService',
        'UserUtilsService',
        'TicketService',
        'QueueService',
        'WorklogService',
        'SessionService',
        'MessageService',
    );

    const [worklogData, setWorklogData] = useState<WorklogRow[] | null>(null);
    const [ticketSummary, setTicketSummary] = useState<Record<string, TicketSummary>>({});
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCount, setSelectedCount] = useState<number | ''>('');
    const [autoUpload, setAutoUpload] = useState(() => $session.CurrentUser.autoUpload || false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        $q.on('completed', () => {
            $message.info('Worklog upload completed');
            setIsLoading(false);
            setSelectedCount('');
        });
    }, [$q, $message]);

    const transformHeader = useCallback((c: string) => {
        if (!c) {
            return '';
        }
        return fieldMapping[c.replace(/[ "]/g, '').toLowerCase()] || '';
    }, []);

    const getSelectedLogs = useCallback((data: WorklogRow[]) => data.filter((w) => w.selected), []);

    const processData = useCallback(
        (data: any[]) => {
            const worklogData = data.map((w) => {
                let { ticketNo = '', startDate = '', timespent = '', comment = '' } = w;

                ticketNo = ticketNo.trim();
                startDate = startDate.trim();
                timespent = timespent.trim();
                comment = comment.trim();

                let selected = true,
                    disabled = false,
                    status = wlStatusWillImport,
                    error = '';

                const setError = (errorText: string) => {
                    selected = false;
                    disabled = true;
                    status = wlStatusInvalid;
                    error = error ? `${error};${errorText}` : errorText;
                };

                if (!ticketNo) setError('Ticket No is required');
                if (!startDate) {
                    setError('Log Date is required');
                } else {
                    const _startDate = $utils.convertDate(startDate);
                    if (_startDate instanceof Date) {
                        startDate = _startDate;
                    } else {
                        setError('Log Date is invalid');
                    }
                }

                if (!timespent) {
                    setError('Timespent is required');
                } else {
                    const _timeSpent = parseTimespent(timespent);
                    if (_timeSpent > 0) {
                        timespent = _timeSpent;
                    } else {
                        setError('Timespent is invalid');
                    }
                }

                return { selected, disabled, status, error, ticketNo, startDate, timespent, comment };
            });

            const selectedWorklogs = getSelectedLogs(worklogData);
            const ticketList = Array.from(new Set(selectedWorklogs.map((w) => w.ticketNo)));

            $ticket.getTicketDetails(ticketList, true).then((list: any[]) => {
                const summary = list.reduce(
                    (obj: Record<string, TicketSummary>, t: any) => {
                        const {
                            key,
                            fields: { summary, assignee, issuetype: { iconUrl, name } = {} as any },
                        } = t;
                        const { displayName } = assignee || {};
                        obj[key] = { summary, assignee: displayName, issueTypeIcon: iconUrl, issueType: name };
                        return obj;
                    },
                    {} as Record<string, TicketSummary>,
                );
                setTicketSummary(summary);
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
        [getSelectedLogs],
    );

    const fileSelected = useCallback(() => {
        const selector = fileSelectorRef.current;
        if (!selector) return;

        const file = selector.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                $message.warning('Unknown file selected to import. Select a valid file to import');
                selector.value = '';
                return;
            }

            Papa.parse<Record<string, string>, File>(file, {
                header: true,
                transformHeader,
                skipEmptyLines: 'greedy',
                complete: (result) => {
                    const { data } = result;
                    if (!data || !data.length) {
                        $message.warning('No rows found to import', 'No records exists');
                    }
                    processData(data);
                },
            });
        }
        selector.value = '';
    }, [transformHeader, processData, $message]);

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
        } catch (err: any) {
            const { message, response, status, error: { errors, errorMessages } = {} } = err;

            log.disabled = true;
            log.selected = false;
            log.status = wlStatusError;

            const errorKeys = errors && Object.keys(errors);
            if (message) {
                log.error = message;
            } else if (errorKeys?.length) {
                log.error = errorKeys.reduce((acc: string, key: string) => (acc ? `${acc}; ${errors[key]}` : errors[key]), '');
            } else if (errorMessages?.length) {
                log.error = errorMessages.reduce((err: string, msg: string) => (err ? `${err}; ${msg}` : msg), '');
            } else if (response?.length > 5 && response.length <= 100) {
                log.error = response;
            } else if (status) {
                log.error = `Status Code: ${status}`;
            }

            setWorklogData((prev) => (prev ? [...prev] : null));
        }
    }, []);

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
                    (err: string) => {
                        wl.status = wlStatusError;
                        wl.error = err;
                    },
                );
            });

            Promise.all(savedWorklogs).then(() => {
                $message.info('Worklog import completed. Upload it to Jira from Calendar or Worklog gadget.');
                setWorklogData((prev) => (prev ? [...prev] : null));
                setSelectedCount('');
            });
        }
    }, [worklogData, autoUpload, uploadSelectedWorklogs]);

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
                                    <Column>
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
