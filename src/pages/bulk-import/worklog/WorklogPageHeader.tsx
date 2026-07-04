import { Button } from '@components';

interface WorklogPageHeaderProps {
    isLoading: boolean;
    onDownloadTemplate: () => void;
    onUploadClick: () => void;
    fileSelectorProps: React.InputHTMLAttributes<HTMLInputElement> & { ref: React.RefObject<HTMLInputElement | null> };
}

function WorklogPageHeader({ isLoading, onDownloadTemplate, onUploadClick, fileSelectorProps }: WorklogPageHeaderProps) {
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
