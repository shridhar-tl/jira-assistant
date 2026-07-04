import classNames from 'classnames';
import type { CalendarViewMode, ToolbarEndRenderProps } from 'fluxo-ui';

import { Button, hideTooltip, showTooltip } from '@components';

import { isTimeGridView } from './calendar-utils';

interface CalendarToolbarProps {
    viewMode: CalendarViewMode;
    pendingWorklogCount: number;
    isLoading: boolean;
    uploading: boolean;
    fullView?: boolean;
    zoomIn?: boolean;
    isGadget: boolean;
    onToggleDisplayHours: () => void;
    onToggleZoom: () => void;
    onUploadAll: () => void;
    onRefresh: () => void;
    onSettings: () => void;
    injectedComponents?: ToolbarEndRenderProps | false;
}

export default function CalendarToolbar({
    viewMode,
    pendingWorklogCount,
    isLoading,
    uploading,
    fullView,
    zoomIn,
    isGadget,
    onToggleDisplayHours,
    onToggleZoom,
    onUploadAll,
    onRefresh,
    onSettings,
    injectedComponents,
}: CalendarToolbarProps) {
    const isGridMode = isTimeGridView(viewMode);

    const hint = (
        <ul className="gadget-hint">
            <li>Pressing left Alt + drag drop worklog will copy the worklog to target slot</li>
            <li>Drag and drop or resize the worklog to edit it</li>
            <li>Right click worklog to see more options</li>
            <li>
                You can change the hours grid in calendar by changing the working
                <br />
                and display hours in General Settings page
            </li>
        </ul>
    );

    return (
        <>
            {isGridMode && (
                <Button
                    layout="plain"
                    size="sm"
                    onClick={onToggleDisplayHours}
                    title={fullView ? 'Click to show only working hours in calendar' : 'Click to show full day calendar'}
                >
                    <i className={fullView ? 'fa fa-compress' : 'fa fa-expand'} />
                </Button>
            )}

            <Button
                layout="plain"
                size="sm"
                onClick={onToggleZoom}
                title={zoomIn ? 'Zoom out to see 15 mins grid' : 'Zoom in to see 5 mins grid'}
            >
                <i className={zoomIn ? 'fa fa-search-minus' : 'fa fa-search-plus'} />
            </Button>

            <PendingUploadButton
                pendingWorklogCount={pendingWorklogCount}
                uploading={uploading}
                isLoading={isLoading}
                onUploadAll={onUploadAll}
            />

            <Button layout="plain" size="sm" disabled={isLoading || uploading} onClick={onRefresh} title="Refresh meetings and worklogs">
                <i className={isLoading ? 'fa fa-refresh fa-spin' : 'fa fa-refresh'} />
            </Button>

            <i
                className="fa fa-info-circle text-amber-500 text-lg cursor-help mx-1"
                onMouseEnter={(e) => showTooltip(e as any, { content: hint, placement: 'bottomLeft' })}
                onMouseLeave={() => hideTooltip()}
            />

            {!isGadget && (
                <Button layout="plain" size="sm" onClick={onSettings} title="Show settings">
                    <i className="fa fa-cogs" />
                </Button>
            )}

            {injectedComponents && injectedComponents.pluginActions}
            {injectedComponents && injectedComponents.viewSwitcher}
        </>
    );
}

interface PendingUploadButtonProps {
    pendingWorklogCount: number;
    uploading: boolean;
    isLoading: boolean;
    onUploadAll: () => void;
}

function PendingUploadButton({ pendingWorklogCount, uploading, isLoading, onUploadAll }: PendingUploadButtonProps) {
    const disabled = uploading || pendingWorklogCount < 1 || isLoading;
    const hasPending = pendingWorklogCount > 0;
    const pulse = hasPending && !uploading;
    const countDisplay = pendingWorklogCount > 99 ? '99+' : pendingWorklogCount;
    const title = hasPending ? `Upload ${pendingWorklogCount} pending worklog(s)` : 'No worklog pending to be uploaded';

    return (
        <span className="relative inline-flex">
            {pulse && (
                <span
                    className="absolute inset-0 rounded-full animate-ping bg-amber-400/60 pointer-events-none"
                    style={{ animationDuration: '1.8s' }}
                />
            )}
            <Button
                layout="plain"
                size="sm"
                disabled={disabled}
                onClick={onUploadAll}
                title={title}
                className={classNames('relative', hasPending && 'text-amber-600')}
            >
                <i className={uploading ? 'fa fa-spin fa-spinner' : 'fa fa-upload'} />
            </Button>
            {hasPending && (
                <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-(--bg-primary)">
                    {countDisplay}
                </span>
            )}
        </span>
    );
}
