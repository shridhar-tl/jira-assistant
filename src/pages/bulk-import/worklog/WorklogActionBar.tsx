import { Button, Checkbox } from '@components';

interface WorklogActionBarProps {
    autoUpload: boolean;
    isLoading: boolean;
    selectedCount: number | '';
    onAutoUploadChange: (value: boolean) => void;
    onClear: () => void;
    onImport: () => void;
}

function WorklogActionBar({ autoUpload, isLoading, selectedCount, onAutoUploadChange, onClear, onImport }: WorklogActionBarProps) {
    return (
        <div className="action-bar">
            <div className="action-bar-left">
                <Checkbox
                    checked={autoUpload}
                    label="Directly upload worklog to Jira"
                    disabled={isLoading}
                    onChange={(e) => onAutoUploadChange(e.value)}
                />
            </div>
            <div className="action-bar-right">
                <Button
                    variant="danger"
                    leftIcon={<i className="fa fa-trash" />}
                    label="Clear"
                    disabled={isLoading}
                    onClick={onClear}
                />
                <Button
                    variant="primary"
                    leftIcon={<i className={autoUpload ? 'fa fa-upload' : 'fa fa-save'} />}
                    disabled={isLoading || !selectedCount}
                    label={autoUpload ? `Upload ${selectedCount} worklogs` : `Import ${selectedCount} worklogs`}
                    onClick={onImport}
                />
            </div>
        </div>
    );
}

export default WorklogActionBar;
