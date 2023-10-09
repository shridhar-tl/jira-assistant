import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'src/controls';
import { usePivotConfig } from '../../store/pivot-config';
import { saveReport, saveReportAs } from '../../utils/common';
import useToggler from 'react-controls/hooks/useToggler';
import SaveReportDialog from 'src/dialogs/SaveReportDialog';
import { inject } from 'src/services';
import Dialog from 'src/dialogs';

function ControlButtons({ reportId }) {
    const navigate = useNavigate();
    const [showSaveDialog, toggleSavePopup] = useToggler(false);

    const saveReportHandler = React.useCallback(async () => {
        if (reportId) {
            await saveReport();
        } else {
            toggleSavePopup();
        }
    }, [reportId, toggleSavePopup]);

    const saveAsCopy = async (name, copy) => {
        const result = await saveReportAs(name, copy);

        toggleSavePopup();

        if (result) {
            const { id, createdBy } = result;
            navigate(`/${createdBy}/reports/pivot/${id}`);
        }
    };

    const deleteReport = React.useCallback(() => {
        deleteCurrentReport((createdBy) => {
            navigate(`/${createdBy}/reports/pivot`);
        });
    }, [navigate]);

    return (<>
        <div className="controls float-end">
            {!!reportId && <Button icon="fa fa-trash" className="mx-1" severity="danger" onClick={deleteReport} title="Delete this report" />}
            <Button icon="fa fa-save" className="mx-1" onClick={saveReportHandler} title="Save this report" />
            {!!reportId && <Button icon="fa fa-copy" className="mx-1" onClick={toggleSavePopup}
                title="Rename report or save as new report" />}
        </div>
        {showSaveDialog && <SaveReportDialog allowCopy={!!reportId} onHide={toggleSavePopup} onChange={saveAsCopy} />}
    </>
    );
}

export default ControlButtons;

function deleteCurrentReport(onDone) {
    const { id, queryName, createdBy } = usePivotConfig.getState();

    Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permanently?`)
        .then(() => {
            const { $report, $message, $analytics } = inject('ReportService', 'MessageService', 'AnalyticsService');

            $report.deleteSavedQuery(id).then(q => {
                $message.success(`Pivot report "${queryName}" deleted successfully`);
                $analytics.trackEvent("Pivot Report Deleted");
                onDone(createdBy);
            });
        });
}