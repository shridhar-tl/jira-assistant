import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { inject } from '@services';

import { Button, Checkbox, Modal, TextInput, type ComponentEvent } from '@components';

import { notifyReportsListChanged } from '../components/ReportSelectList';
import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import { Dialog } from '../dialogs/CommonDialog';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

interface ReportItem {
    id: number;
    queryName: string;
    reportType: string;
    advanced?: boolean;
    isNew?: boolean;
    outputCount?: number;
    dateCreated: Date;
    displayDate: string;
    sortDate: number;
    selected: boolean;
}

interface ImportReportItem {
    queryName: string;
    oldName: string;
    selected: boolean;
    disabled?: boolean;
    status: string;
    dateCreated?: Date;
    dateUpdated?: Date;
    [key: string]: any;
}

function getReportTypeLabel(rpt: { reportType: string; advanced?: boolean; isNew?: boolean }): string {
    if (rpt.reportType === 'pivot') {
        return 'Pivot report';
    } else if (rpt.isNew) {
        return 'Custom report';
    } else if (rpt.advanced) {
        return 'Advanced report';
    }
    return 'Custom Report (Old)';
}

function getReportPath(rpt: { reportType: string; advanced?: boolean; isNew?: boolean }): string | null {
    // Only pivot reports have a viewer page migrated currently
    if (rpt.reportType === 'pivot') {
        return 'pivot';
    }
    return null;
}

export default function MyReports(props: BaseGadgetProps) {
    const [reportsList, setReportsList] = useState<ReportItem[]>([]);
    const [selAllChk, setSelAllChk] = useState(false);
    const [reportsToImport, setReportsToImport] = useState<ImportReportItem[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { userId } = useParams<{ userId?: string }>();

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.MyReports,
    });

    const { setIsLoading } = gadgetHook;

    const refreshData = useCallback(() => {
        setIsLoading(true);
        const { $report, $userutils } = inject('ReportService', 'UserUtilsService');

        $report
            .getReportsList()
            .then((result: any[]) => {
                const mapped: ReportItem[] = (result || []).map((r) => ({
                    id: r.id,
                    queryName: r.queryName,
                    reportType: r.reportType,
                    advanced: r.advanced,
                    isNew: r.isNew,
                    outputCount: r.outputCount,
                    dateCreated: r.dateCreated,
                    displayDate: $userutils.formatDateTime(r.dateCreated),
                    sortDate: new Date(r.dateCreated).getTime(),
                    selected: false,
                }));
                setReportsList(mapped);
                setSelAllChk(false);
            })
            .catch(() => {
                const { $message } = inject('MessageService');
                $message.error('Failed to load reports');
            })
            .finally(() => setIsLoading(false));
    }, [setIsLoading]);

    useEffect(() => {
        refreshData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedCount = useMemo(() => reportsList.filter((r) => r.selected).length, [reportsList]);

    const selectAll = useCallback((e: ComponentEvent<boolean>) => {
        const checked = e.value;
        setSelAllChk(checked);
        setReportsList((prev) => prev.map((r) => ({ ...r, selected: checked })));
    }, []);

    const toggleRow = useCallback((id: number) => {
        setReportsList((prev) => {
            const next = prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r));
            const allSelected = next.length > 0 && next.every((r) => r.selected);
            setSelAllChk(allSelected);
            return next;
        });
    }, []);

    const viewReport = useCallback(
        (rpt: ReportItem) => {
            const path = getReportPath(rpt);
            if (!path) {
                const { $message } = inject('MessageService');
                $message.warning('This report type is not yet supported. Only Pivot reports can be opened.');
                return;
            }
            navigate(`/${userId}/reports/${path}/${rpt.id}`);
        },
        [navigate, userId],
    );

    const deleteSelectedReports = useCallback(() => {
        const ids = reportsList.filter((r) => r.selected).map((r) => r.id);
        const { $report, $message } = inject('ReportService', 'MessageService');

        if (ids.length === 0) {
            $message.info('Select the reports to be deleted!');
            return;
        }

        Dialog.confirmDelete('Are you sure to delete the selected report(s)?', 'Confirm delete report(s)').then(() => {
            setIsLoading(true);
            $report
                .deleteSavedQuery(ids)
                .then(() => {
                    $message.success(`${ids.length} report(s) deleted successfully`);
                    notifyReportsListChanged();
                    refreshData();
                })
                .catch(() => {
                    $message.error('Failed to delete the selected reports');
                    setIsLoading(false);
                });
        });
    }, [reportsList, refreshData, setIsLoading]);

    const deleteReport = useCallback(
        (rpt: ReportItem) => {
            const { $report, $message } = inject('ReportService', 'MessageService');

            Dialog.confirmDelete(`Are you sure to delete the report "${rpt.queryName}"?`, 'Confirm delete report').then(() => {
                setIsLoading(true);
                $report
                    .deleteReport(rpt.id)
                    .then(() => {
                        $message.success('Report deleted successfully');
                        notifyReportsListChanged();
                        refreshData();
                    })
                    .catch(() => {
                        $message.error('Failed to delete the report');
                        setIsLoading(false);
                    });
            });
        },
        [refreshData, setIsLoading],
    );

    const downloadReports = useCallback(() => {
        const ids = reportsList.filter((r) => r.selected).map((r) => r.id);
        const { $report, $message } = inject('ReportService', 'MessageService');

        if (ids.length === 0) {
            $message.info('Select the reports to be exported!');
            return;
        }

        $report.exportQueries(ids);
    }, [reportsList]);

    const chooseFileForImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const fileSelected = useCallback(() => {
        const selector = fileInputRef.current;
        if (!selector) return;

        const file = selector.files?.[0];
        if (!file) return;

        const { $message } = inject('MessageService');

        if (!file.name.endsWith('.jrd')) {
            $message.warning('Unknown file selected to import. Select a valid Jira Assist Report definition (*.jrd) file');
            selector.value = '';
            return;
        }

        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (evt) => {
            const json = evt.target?.result as string;
            try {
                const rpt = JSON.parse(json);
                const reports = rpt.reports;
                if (!reports || !Array.isArray(reports)) {
                    $message.error('Selected file is invalid or is corrupted');
                    return;
                }
                const prepared: ImportReportItem[] = reports.map((r: any) => ({
                    ...r,
                    oldName: r.queryName,
                    selected: true,
                    status: 'Will import',
                }));
                setReportsToImport(prepared);
            } catch {
                $message.error('Selected file is invalid or is corrupted');
            }
        };
        reader.onerror = () => {
            $message.error('Selected file is invalid or is corrupted. Unable to load the file!');
        };

        selector.value = '';
    }, []);

    const hideImportPopup = useCallback(
        (refresh?: boolean) => {
            setReportsToImport(null);
            if (refresh) {
                notifyReportsListChanged();
                refreshData();
            }
        },
        [refreshData],
    );

    const customActions = useMemo(
        () => (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".jrd"
                    onChange={fileSelected}
                />
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-upload" />}
                    onClick={chooseFileForImport}
                    title="Import reports shared by others"
                    size="sm"
                />
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-download" />}
                    onClick={downloadReports}
                    disabled={selectedCount === 0}
                    title="Export selected reports to share with others"
                    size="sm"
                />
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-trash" />}
                    onClick={deleteSelectedReports}
                    disabled={selectedCount === 0}
                    title="Delete selected report(s)"
                    size="sm"
                />
            </>
        ),
        [fileSelected, chooseFileForImport, downloadReports, deleteSelectedReports, selectedCount],
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} refreshData={refreshData} customActions={customActions}>
            <ScrollableTable dataset={reportsList} exportSheetName="My reports">
                <THead>
                    <tr>
                        <Column className="w-10" noExport>
                            <Checkbox checked={selAllChk} onChange={selectAll} />
                        </Column>
                        <Column sortBy="queryName">Report name</Column>
                        <Column sortBy="reportType">Report type</Column>
                        <Column sortBy="outputCount">Output fields</Column>
                        <Column sortBy="sortDate">Created on</Column>
                        <Column className="w-24 text-center" noExport>
                            Actions
                        </Column>
                    </tr>
                </THead>
                <TBody>
                    {(r: ReportItem) => {
                        const canView = !!getReportPath(r);
                        return (
                            <tr key={r.id} data-test-id={`report-${r.id}`}>
                                <td className="text-center">
                                    <Checkbox checked={r.selected} onChange={() => toggleRow(r.id)} />
                                </td>
                                <td className="font-medium">{r.queryName}</td>
                                <td>{getReportTypeLabel(r)}</td>
                                <td>{r.outputCount ?? '-'}</td>
                                <td>{r.displayDate}</td>
                                <td className="text-center">
                                    <div className="flex justify-center gap-1">
                                        <Button
                                            layout="plain"
                                            size="sm"
                                            leftIcon={<i className="fa fa-eye" />}
                                            onClick={() => viewReport(r)}
                                            disabled={!canView}
                                            title={canView ? 'View / edit this report' : 'This report type is not supported yet'}
                                        />
                                        <Button
                                            layout="plain"
                                            size="sm"
                                            leftIcon={<i className="fa fa-trash" />}
                                            onClick={() => deleteReport(r)}
                                            title="Delete this report"
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    }}
                </TBody>
                <NoDataRow span={6}>You have not yet created or imported any reports.</NoDataRow>
            </ScrollableTable>
            {reportsToImport && <ImportReportsDialog reportsToImport={reportsToImport} onHide={hideImportPopup} />}
        </GadgetContainer>
    );
}

interface ImportReportsDialogProps {
    reportsToImport: ImportReportItem[];
    onHide: (refresh?: boolean) => void;
}

function ImportReportsDialog({ reportsToImport: initialReports, onHide }: ImportReportsDialogProps) {
    const [reports, setReports] = useState<ImportReportItem[]>(initialReports);
    const [selectAll, setSelectAll] = useState(true);
    const [showDialog, setShowDialog] = useState(true);

    const handleHide = useCallback(
        (refresh?: boolean) => {
            setShowDialog(false);
            onHide(refresh);
        },
        [onHide],
    );

    const selectedCount = useMemo(() => reports.filter((r) => r.selected).length, [reports]);

    const updateReportStatus = (report: ImportReportItem): ImportReportItem => {
        if (report.selected) {
            if (!report.queryName) {
                report.queryName = report.oldName;
                report.status = 'Name required';
            } else {
                report.status = 'Will import';
            }
        } else {
            report.status = 'Excluded';
        }
        return report;
    };

    const toggleSelectAll = useCallback((e: ComponentEvent<boolean>) => {
        const checked = e.value;
        setSelectAll(checked);
        setReports((prev) =>
            prev.map((r) => {
                if (r.disabled) return r;
                const updated = { ...r, selected: checked };
                return updateReportStatus(updated);
            }),
        );
    }, []);

    const toggleReport = useCallback((index: number) => {
        setReports((prev) =>
            prev.map((r, i) => {
                if (i !== index) return r;
                const updated = { ...r, selected: !r.selected };
                return updateReportStatus(updated);
            }),
        );
    }, []);

    const reportNameChanged = useCallback((index: number, newName: string) => {
        setReports((prev) =>
            prev.map((r, i) => {
                if (i !== index) return r;
                const updated = { ...r, queryName: newName };
                if (updated.selected) {
                    updated.status = newName ? 'Will import' : 'Name required';
                }
                return updated;
            }),
        );
    }, []);

    const importReports = useCallback(async () => {
        const { $report, $message } = inject('ReportService', 'MessageService');
        const selectedReports = reports.filter((r) => r.selected && r.queryName);

        if (selectedReports.length === 0) {
            $message.info('Select at least one report with a valid name to import');
            return;
        }

        const updatedReports = [...reports];
        const saveActions = selectedReports.map(async (r) => {
            const newObj: any = { ...r };
            delete newObj.selected;
            delete newObj.id;
            delete newObj.oldName;
            delete newObj.status;
            delete newObj.disabled;

            try {
                await $report.saveQuery(newObj);
                const idx = updatedReports.findIndex((x) => x === r);
                if (idx !== -1) {
                    updatedReports[idx] = { ...r, selected: false, disabled: true, status: 'Imported' };
                }
                return true;
            } catch {
                const idx = updatedReports.findIndex((x) => x === r);
                if (idx !== -1) {
                    updatedReports[idx] = { ...r, status: 'Duplicate name' };
                }
                return false;
            }
        });

        const results = await Promise.all(saveActions);
        const successCount = results.filter(Boolean).length;
        const failedCount = results.length - successCount;

        if (failedCount === 0) {
            $message.success(`${successCount} selected reports were imported`, 'Reports imported');
            handleHide(true);
        } else {
            $message.error('Some of the reports were not imported!', 'Import failed');
            setReports(updatedReports);
            // Trigger a list refresh for any that did succeed
            if (successCount > 0) {
                notifyReportsListChanged();
            }
        }
    }, [reports, handleHide]);

    return (
        <Modal isOpen={showDialog} onClose={() => handleHide()} title="Select reports to import" size="lg">
            <div className="flex flex-col gap-4">
                <div className="px-4 pt-2 text-sm text-secondary">
                    Select all the reports which you would like to import and provide a name for the report to import.
                </div>
                <ScrollableTable dataset={reports}>
                    <THead>
                        <tr>
                            <Column className="w-10">
                                <Checkbox checked={selectAll} onChange={toggleSelectAll} />
                            </Column>
                            <Column>Report name</Column>
                            <Column>Report name (new)</Column>
                            <Column>Created date</Column>
                            <Column>Last modified date</Column>
                            <Column>Status</Column>
                        </tr>
                    </THead>
                    <TBody>
                        {(rpt: ImportReportItem, i: number) => {
                            const { $userutils } = inject('UserUtilsService');
                            return (
                                <tr key={`${i}_${rpt.status}`}>
                                    <td className="text-center">
                                        <Checkbox checked={rpt.selected} disabled={rpt.disabled} onChange={() => toggleReport(i)} />
                                    </td>
                                    <td>{rpt.oldName}</td>
                                    <td>
                                        <TextInput
                                            value={rpt.queryName}
                                            disabled={rpt.disabled || !rpt.selected}
                                            onChange={(e: ComponentEvent<string>) => reportNameChanged(i, e.value)}
                                        />
                                    </td>
                                    <td>{rpt.dateCreated ? $userutils.formatDateTime(rpt.dateCreated) : '-'}</td>
                                    <td>{rpt.dateUpdated ? $userutils.formatDateTime(rpt.dateUpdated) : '-'}</td>
                                    <td>{rpt.status}</td>
                                </tr>
                            );
                        }}
                    </TBody>
                    <NoDataRow span={6}>No reports available to import</NoDataRow>
                </ScrollableTable>
                <div className="flex justify-end gap-2 pt-4 border-t border-(--border-color)">
                    <Button variant="secondary" leftIcon={<i className="fa fa-times" />} onClick={() => handleHide()}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<i className="fa fa-check" />}
                        disabled={selectedCount === 0}
                        onClick={importReports}
                    >
                        Import
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
