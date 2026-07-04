import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { inject } from '@services';

import { Button } from '@components';
import { notifyReportsListChanged } from '@components/ReportSelectList';

import { Dialog } from '@dialogs/CommonDialog';
import SaveReportDialog from '@dialogs/SaveReportDialog';

import { usePivotConfig } from '../../store/pivot-config';
import { saveReport, saveReportAs } from '../../utils/common';

interface ControlButtonsProps {
    reportId?: string;
}

export default function ControlButtons({ reportId }: ControlButtonsProps) {
    const navigate = useNavigate();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const toggleSavePopup = () => setShowSaveDialog(!showSaveDialog);

    const saveReportHandler = useCallback(async () => {
        if (reportId) {
            await saveReport();
        } else {
            toggleSavePopup();
        }
    }, [reportId]);

    const saveAsCopy = async (name: string, copy?: boolean) => {
        const result = await saveReportAs(name, copy);

        toggleSavePopup();

        if (result) {
            const { id, createdBy } = result;
            navigate(`/${createdBy}/reports/pivot/${id}`);
        }
    };

    const deleteReport = useCallback(() => {
        deleteCurrentReport((createdBy: string) => {
            navigate(`/${createdBy}/reports/pivot`);
        });
    }, [navigate]);

    return (
        <>
            <div className="flex gap-2">
                {!!reportId && (
                    <Button
                        layout="plain"
                        leftIcon={<span className="fa fa-trash" />}
                        onClick={deleteReport}
                        title="Delete this report"
                        className="text-red-600"
                    />
                )}
                <Button layout="plain" leftIcon={<span className="fa fa-save" />} onClick={saveReportHandler} title="Save this report" />
                {!!reportId && (
                    <Button
                        layout="plain"
                        leftIcon={<span className="fa fa-copy" />}
                        onClick={toggleSavePopup}
                        title="Rename report or save as new report"
                    />
                )}
            </div>
            {showSaveDialog && <SaveReportDialog allowCopy={!!reportId} onHide={toggleSavePopup} onChange={saveAsCopy} />}
        </>
    );
}

function deleteCurrentReport(onDone: (createdBy: string) => void) {
    const { id, queryName, createdBy } = usePivotConfig.getState();

    if (!id) return;

    Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permanently?`)
        .then(() => {
            const { $report, $message, $analytics } = inject('ReportService', 'MessageService', 'AnalyticsService');

            $report.deleteSavedQuery([id]).then(() => {
                notifyReportsListChanged();
                $message.success(`Pivot report "${queryName}" deleted successfully`);
                $analytics.trackEvent('Pivot Report Deleted', '');
                if (createdBy) {
                    onDone(createdBy);
                }
            });
        });
}
