import { useService } from '@/services/injector';

import { Button, hideTooltip, showTooltip, type EntryRenderContext } from '@components';

import { getEntryTimeFormat, isListView, isTimeGridView } from './calendar-utils';
import type { CalendarEntryData, SuggestionDaySummary, WorklogSuggestion } from './types';

interface SuggestionEntryContentProps {
    data: CalendarEntryData;
    context: EntryRenderContext;
    color: string;
    busyIds: Set<string>;
    onAccept: (suggestion: WorklogSuggestion) => void;
    onAcceptAll: (suggestions: WorklogSuggestion[]) => void;
    onDismiss: (suggestions: WorklogSuggestion[]) => void;
}

interface ActionIconsProps {
    busy: boolean;
    onLight: boolean;
    acceptTitle: string;
    dismissTitle: string;
    onAccept: () => void;
    onDismiss: () => void;
}

const actionSizeClassName = 'min-h-4! min-w-4! h-4! w-4! p-0!';
const onEntryClassName = `${actionSizeClassName} text-white! hover:bg-white/25!`;
const onLightClassName = `${actionSizeClassName} text-(--text-secondary)! hover:bg-(--bg-hover)! hover:text-(--text-primary)!`;

function ActionIcons({ busy, onLight, acceptTitle, dismissTitle, onAccept, onDismiss }: ActionIconsProps) {
    const actionClassName = onLight ? onLightClassName : onEntryClassName;
    const handle = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        hideTooltip({ timeout: 0 });
        action();
    };

    return (
        <span className="cal-suggestion-actions inline-flex shrink-0 items-center gap-0.5 pointer-events-auto @max-[4.5rem]:hidden">
            <Button
                layout="plain"
                size="xs"
                className={actionClassName}
                title={acceptTitle}
                isLoading={busy}
                leftIcon={<i className="fa fa-check text-[10px]" />}
                data-event-icon="true"
                onClick={handle(onAccept)}
            />
            {!busy && (
                <Button
                    layout="plain"
                    size="xs"
                    className={actionClassName}
                    title={dismissTitle}
                    leftIcon={<i className="fa fa-times text-[10px]" />}
                    data-event-icon="true"
                    onClick={handle(onDismiss)}
                />
            )}
        </span>
    );
}

interface SuggestionDetailsProps {
    suggestion: WorklogSuggestion;
    label: string;
    action: string;
}

function SuggestionDetails({ suggestion, label, action }: SuggestionDetailsProps) {
    const { $utils, $session } = useService('UtilsService', 'SessionService');
    const timeFormat = getEntryTimeFormat($session.CurrentUser.timeFormat);
    const { activeRanges, issueLoggedSecs, dayLoggedSecs, targetSecs, ticketCount } = suggestion.reason;
    const ranges = activeRanges.map((r) => `${$utils.formatDate(r.start, timeFormat)} - ${$utils.formatDate(r.end, timeFormat)}`).join(', ');
    const activeSecs = activeRanges.reduce((sum, r) => sum + (r.end.getTime() - r.start.getTime()) / 1000, 0);

    return (
        <div className="cal-suggestion-details flex flex-col gap-1 max-w-80 text-xs">
            <div className="font-semibold">{`${label} on ${suggestion.issueKey}`}</div>
            <div>{suggestion.summary}</div>
            <div className="font-semibold mt-1">Why suggested</div>
            <ul className="list-disc pl-4 flex flex-col gap-0.5">
                <li>{`In progress and assigned to you: ${ranges} (${$utils.formatSecs(activeSecs)})`}</li>
                <li>{issueLoggedSecs ? `Already logged on this ticket that day: ${$utils.formatSecs(issueLoggedSecs)}` : 'Nothing logged on this ticket that day'}</li>
                <li>
                    {dayLoggedSecs
                        ? `Logged that day: ${$utils.formatSecs(dayLoggedSecs)} of ${$utils.formatSecs(targetSecs)} minimum hours`
                        : `Nothing logged that day, minimum hours: ${$utils.formatSecs(targetSecs)}`}
                </li>
                {ticketCount > 1 && <li>{`Remaining time is shared by ${ticketCount} tickets in progress that day`}</li>}
            </ul>
            <div className="mt-1 italic">{action}</div>
        </div>
    );
}

export default function SuggestionEntryContent({ data, context, color, busyIds, onAccept, onAcceptAll, onDismiss }: SuggestionEntryContentProps) {
    const { $utils } = useService('UtilsService');
    const inList = isListView(context.view);
    const iconStyle = inList ? { color } : undefined;
    const listClassName = inList ? 'cal-list-content border-l-2 border-dashed pl-2' : '';
    const listStyle = inList ? { borderColor: color } : undefined;

    if (data.entryType === 5) {
        const { suggestions } = data.sourceObject as SuggestionDaySummary;
        const totalSecs = suggestions.reduce((sum, s) => sum + s.timeSpentSecs, 0);
        const busy = suggestions.some((s) => busyIds.has(s.id));

        return (
            <div
                className={`cal-suggestion-content @container flex items-center gap-1 min-w-0 ${listClassName}`}
                style={listStyle}
                title="Suggested worklogs based on the tickets you worked on"
            >
                <i className="fa fa-lightbulb shrink-0" style={iconStyle} />
                <span className="cal-suggestion-label flex-1 min-w-0 truncate">{`${suggestions.length} suggested (${$utils.formatSecs(totalSecs)})`}</span>
                <ActionIcons
                    busy={busy}
                    onLight={inList}
                    acceptTitle="Log all suggestions of this day"
                    dismissTitle="Dismiss all suggestions of this day"
                    onAccept={() => onAcceptAll(suggestions)}
                    onDismiss={() => onDismiss(suggestions)}
                />
            </div>
        );
    }

    const suggestion = data.sourceObject as WorklogSuggestion;
    const duration = $utils.formatSecs(suggestion.timeSpentSecs);
    const label = suggestion.targetWorklog ? `Extend by ${duration}` : `Suggested ${duration}`;
    const action = suggestion.targetWorklog ? 'Click to extend the existing worklog' : 'Click to review and log';
    const header = (
        <div
            className="cal-suggestion-header flex items-center gap-1 min-w-0 pointer-events-auto cursor-pointer"
            onMouseEnter={(e) =>
                showTooltip(e, { content: <SuggestionDetails suggestion={suggestion} label={label} action={action} />, placement: 'bottomRight' })
            }
            onMouseLeave={() => hideTooltip({ timeout: 0 })}
            onClick={() => hideTooltip({ timeout: 0 })}
        >
            <i className={suggestion.targetWorklog ? 'fa fa-plus-circle shrink-0' : 'fa fa-lightbulb shrink-0'} style={iconStyle} />
            <span className="cal-suggestion-label flex-1 min-w-0 truncate">
                <span className="font-semibold">{suggestion.issueKey}</span>
                {` · ${suggestion.targetWorklog ? `+${duration}` : duration}`}
            </span>
            <ActionIcons
                busy={busyIds.has(suggestion.id)}
                onLight={inList}
                acceptTitle={suggestion.targetWorklog ? 'Extend the existing worklog' : 'Log this suggestion'}
                dismissTitle="Dismiss suggestions of this ticket for the day"
                onAccept={() => onAccept(suggestion)}
                onDismiss={() => onDismiss([suggestion])}
            />
        </div>
    );

    if (isTimeGridView(context.view)) {
        return (
            <div className="cal-entry-content cal-suggestion-content @container" data-jira-key={suggestion.issueKey} data-suggestion-id={suggestion.id}>
                {header}
                {!context.isCompact && <div className="cal-entry-title short-desc">{suggestion.summary}</div>}
            </div>
        );
    }

    return (
        <div
            className={`cal-entry-content cal-suggestion-content @container ${inList ? listClassName : 'cal-daygrid-content'}`}
            style={listStyle}
            data-jira-key={suggestion.issueKey} data-suggestion-id={suggestion.id}>
            {header}
        </div>
    );
}
