import { memo, type MouseEvent } from 'react';

import { hideTooltip, showTooltip } from '@components';

import { formatDateTime, formatDuration } from './format-utils';
import type { IssueStatusMetrics, StatusSegment, TimelineScale } from './types';

interface StatusTimelineBarProps {
    metrics: IssueStatusMetrics;
    statusColors: Record<string, string>;
    dayLength: number;
    scale: TimelineScale;
    timelineStart: number;
    timelineEnd: number;
}

function SegmentTooltip({ segment, dayLength, isLast }: { segment: StatusSegment; dayLength: number; isLast: boolean }) {
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold">{segment.status}</span>
            <span>{formatDuration(segment.duration, dayLength)}</span>
            <span className="opacity-80">
                {formatDateTime(segment.start)} – {isLast && segment.end === segment.start ? 'now' : formatDateTime(segment.end)}
            </span>
        </div>
    );
}

function StatusTimelineBar({ metrics, statusColors, dayLength, scale, timelineStart, timelineEnd }: StatusTimelineBarProps) {
    const { segments } = metrics;
    const lastIndex = segments.length - 1;
    const range = Math.max(1, timelineEnd - timelineStart);

    const showSegment = (e: MouseEvent<HTMLElement>, segment: StatusSegment, index: number) =>
        showTooltip(e, { content: <SegmentTooltip segment={segment} dayLength={dayLength} isLast={index === lastIndex} />, placement: 'topLeft' });

    const exportText = segments
        .filter((s) => s.duration > 0)
        .map((s) => `${s.status}: ${formatDuration(s.duration, dayLength)}`)
        .join(', ');

    if (scale === 'calendar') {
        return (
            <div className="relative h-3.5 w-full min-w-48 overflow-hidden rounded bg-(--bg-tertiary)" data-export-data={exportText}>
                {segments.map((segment, index) => {
                    const left = ((segment.start - timelineStart) * 100) / range;
                    const width = ((segment.end - segment.start) * 100) / range;
                    if (width <= 0) {
                        return null;
                    }
                    return (
                        <span
                            key={`${segment.statusId}_${segment.start}`}
                            className="tis-segment absolute top-0 h-full cursor-pointer"
                            style={{ left: `${left}%`, width: `max(${width}%, 2px)`, backgroundColor: statusColors[segment.statusId] }}
                            onMouseEnter={(e) => showSegment(e, segment, index)}
                            onMouseLeave={() => hideTooltip()}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex h-3.5 w-full min-w-48 overflow-hidden rounded bg-(--bg-tertiary)" data-export-data={exportText}>
            {segments.map((segment, index) =>
                segment.duration > 0 ? (
                    <span
                        key={`${segment.statusId}_${segment.start}`}
                        className="tis-segment h-full min-w-0.5 cursor-pointer"
                        style={{ flexGrow: segment.duration, flexBasis: 0, backgroundColor: statusColors[segment.statusId] }}
                        onMouseEnter={(e) => showSegment(e, segment, index)}
                        onMouseLeave={() => hideTooltip()}
                    />
                ) : null,
            )}
        </div>
    );
}

export default memo(StatusTimelineBar);
