import type { Worklog } from '@types';

interface WorklogOptionsProps {
    worklog: Worklog;
    onUpload: (id: number) => void;
    onClone: (worklog: Worklog) => void;
}

export default function WorklogOptions({ worklog, onUpload, onClone }: WorklogOptionsProps) {
    return (
        <div className="worklog-options">
            {!worklog.worklogId && (
                <span
                    className="fa fa-upload"
                    title="Upload this worklog"
                    data-event-icon="true"
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onUpload(worklog.id);
                    }}
                />
            )}
            <span
                className="fa fa-clone"
                title="Clone worklog to same time"
                data-event-icon="true"
                onClick={(e: any) => {
                    e.stopPropagation();
                    onClone(worklog);
                }}
            />
        </div>
    );
}
