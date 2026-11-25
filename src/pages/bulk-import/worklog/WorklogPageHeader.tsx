import { Button, Dropdown } from '@components';

import type { ImportDateOrder } from '@utils';


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
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between p-4 sm:px-6 bg-(--bg-secondary) border-b border-(--border-secondary)">
            <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-(--text-primary) flex items-center gap-2">
                    <i className="fa fa-clock text-(--color-primary-600)" />
                    Bulk Import - Worklog
                </h1>
                <p className="text-sm text-(--text-secondary)">Import multiple worklogs from a CSV file directly into Jira</p>
            </div>
            <div className="header-actions flex flex-wrap items-center gap-2">
                <div className="w-56">
                    <Dropdown
                        options={dateOrderOptions}
                        value={dateOrder}
                        onChange={(e) => onDateOrderChange(e.value as ImportDateOrder)}
                        disabled={isLoading}
                    />
                </div>
                <Button
                    variant="secondary"
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
                <input {...fileSelectorProps} type="file" className="hidden" accept=".csv,text/csv" />
            </div>
        </div>
    );
}

export default WorklogPageHeader;
