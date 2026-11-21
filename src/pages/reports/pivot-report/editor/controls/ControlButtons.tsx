import { useCallback } from 'react';

import { useNavigate } from 'react-router';

import { Button } from '@components';

import { usePivotConfig } from '../../store/pivot-config';
import { openSaveDialog } from '../../store/save-dialog';
import { deleteReport, getReportsHomePath, saveReport } from '../../utils/common';
import { generateReport } from '../../viewer/generator';

interface ControlButtonsProps {
    reportId?: string;
}

export default function ControlButtons({ reportId }: ControlButtonsProps) {
    const navigate = useNavigate();

    const saveReportHandler = useCallback(async () => {
        if (reportId) {
            await saveReport();
        } else {
            openSaveDialog();
        }
    }, [reportId]);

    const deleteCurrentReport = useCallback(async () => {
        const { id, queryName, createdBy } = usePivotConfig.getState();

        if (id && (await deleteReport(id, queryName)) && createdBy) {
            navigate(getReportsHomePath(createdBy));
        }
    }, [navigate]);

    return (
        <div className="flex items-center gap-1">
            <Button layout="plain" leftIcon={<span className="fa fa-play" />} onClick={generateReport} title="Generate the report" />
            {!!reportId && (
                <Button
                    layout="plain"
                    leftIcon={<span className="fa fa-trash" />}
                    onClick={deleteCurrentReport}
                    title="Delete this report"
                    className="text-red-600"
                />
            )}
            <Button layout="plain" leftIcon={<span className="fa fa-save" />} onClick={saveReportHandler} title="Save this report" />
            {!!reportId && (
                <Button layout="plain" leftIcon={<span className="fa fa-copy" />} onClick={openSaveDialog} title="Rename report or save as new report" />
            )}
        </div>
    );
}
