import type { ImportDateOrder } from '@utils';

import { Button, Dropdown } from '@components';

const dateOrderOptions: { value: ImportDateOrder; label: string }[] = [
    { value: 'auto', label: 'Date format: Auto detect' },
    { value: 'dmy', label: 'Date format: DD/MM/YYYY' },
    { value: 'mdy', label: 'Date format: MM/DD/YYYY' },
];

interface WorklogPageHeaderProps {
    isLoading: boolean;
    dateOrder: ImportDateOrder;
    onDateOrderChange: (order: ImportDateOrder) => void;
    onDownloadTemplate: () => void;
    onUploadClick: () => void;
    fileSelectorProps: React.InputHTMLAttributes<HTMLInputElement> & { ref: React.RefObject<HTMLInputElement | null> };
}

function WorklogPageHeader({ isLoading, dateOrder, onDateOrderChange, onDownloadTemplate, onUploadClick, fileSelectorProps }: WorklogPageHeaderProps) {
    return (
        <div className="page-header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="page-title">
                        <i className="fa fa-clock" />
                        Bulk Import - Worklog
                    </h1>
                    <p className="page-subtitle">Import multiple worklogs from a CSV file directly into Jira</p>
                </div>
                <div className="header-actions">
                    <Dropdown
                        options={dateOrderOptions}
                        value={dateOrder}
                        onChange={(e) => onDateOrderChange(e.value as ImportDateOrder)}
                        className="w-56"
                        disabled={isLoading}
                    />
                    <Button
                        variant="info"
                        leftIcon={<i className="fa fa-download" />}
                        label="Download Template"
                        onClick={onDownloadTemplate}
                    />
                    <Button
                        variant="primary"
                        leftIcon={<i className="fa fa-upload" />}
                        label="Upload CSV"
                        onClick={onUploadClick}
                        disabled={isLoading}
                    />
                    <input {...fileSelectorProps} type="file" style={{ display: 'none' }} accept=".csv,.json,.xlsx" />
                </div>
            </div>
        </div>
    );
}

export default WorklogPageHeader;
