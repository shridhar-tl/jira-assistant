import { useCallback, useState } from 'react';

import { Button, OverlayPanel, SelectButton } from '@components';

import { GadgetAlert } from '../shared';

import BottleneckTable, { type OpenStatusIssues } from './BottleneckTable';
import { jqlRequiredMessage, viewOptions } from './constants';
import GroupBySelector from './GroupBySelector';
import IssueTimelineTable from './IssueTimelineTable';
import LargeQueryGuard from './LargeQueryGuard';
import LoadNotices from './LoadNotices';
import StatusIssueList from './StatusIssueList';
import StatusLegend from './StatusLegend';
import SummaryCards from './SummaryCards';
import TimeInStatusInfo from './TimeInStatusInfo';
import type { StatusStats, TimeInStatusSettings, TimeInStatusView as ViewType } from './types';
import type { TimeInStatusState } from './useTimeInStatus';

import './TimeInStatus.css';

interface TimeInStatusViewProps {
    settings: TimeInStatusSettings;
    state: TimeInStatusState;
    onSettingsChange: (changes: Partial<TimeInStatusSettings>) => void;
    onAddWorklog?: (ticketKey: string) => void;
    bottleneckOnly?: boolean;
}

interface ActiveStatus {
    target: HTMLElement;
    stats: StatusStats;
    groupName: string | null;
}

const noIssuesMessage = 'No issues matched the configured scope. Change the JQL, user groups or the period in settings.';

export default function TimeInStatusView({
    settings,
    state,
    onSettingsChange,
    onAddWorklog,
    bottleneckOnly,
}: TimeInStatusViewProps) {
    const [activeStatus, setActiveStatus] = useState<ActiveStatus | null>(null);
    const { model, dataset, guard, error, isConfigured, loadingText, runAnyway, reload } = state;
    const view: ViewType = bottleneckOnly ? 'bottleneck' : settings.view;

    const openIssues = useCallback<OpenStatusIssues>((target, stats, groupName) => setActiveStatus({ target, stats, groupName }), []);
    const closeIssues = useCallback(() => setActiveStatus(null), []);

    const renderBody = () => {
        if (!isConfigured) {
            return <TimeInStatusInfo note={jqlRequiredMessage} />;
        }
        if (guard) {
            return <LargeQueryGuard guard={guard} onRunAnyway={runAnyway} />;
        }
        if (!model || !dataset) {
            return error ? (
                <GadgetAlert action={<Button label="Retry" size="sm" layout="outlined" leftIcon={<i className="fa fa-refresh" />} onClick={reload} />}>
                    {error}
                </GadgetAlert>
            ) : (
                <div className="flex flex-1 items-center justify-center gap-2 p-8 text-sm text-(--text-secondary)">
                    <i className="fa fa-spinner fa-spin" />
                    {loadingText || 'Loading...'}
                </div>
            );
        }
        if (!model.issues.length) {
            return <TimeInStatusInfo note={noIssuesMessage} />;
        }

        const { cachedIssues, totalIssues } = dataset.loadStats;

        return (
            <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {!bottleneckOnly && (
                        <SelectButton
                            items={viewOptions}
                            value={view}
                            onChange={(e) => onSettingsChange({ view: e.value as ViewType })}
                            variant="segmented"
                            size="sm"
                        />
                    )}
                    {view === 'bottleneck' && (
                        <GroupBySelector
                            value={settings.groupBy}
                            onChange={(groupBy) => onSettingsChange({ groupBy })}
                            className="w-full sm:w-52"
                        />
                    )}
                    <span className="ms-auto text-[11px] text-(--text-secondary)" title="Status history is cached on this device">
                        {settings.workingHoursOnly && <i className="fa fa-briefcase me-1" title="Only working hours are counted" />}
                        {cachedIssues > 0 ? `${cachedIssues} of ${totalIssues} from cache` : `${totalIssues} issue(s)`}
                    </span>
                </div>

                <LoadNotices stats={dataset.loadStats} />
                <SummaryCards summary={model.overall} dayLength={model.dayLength} statusColors={model.statusColors} />

                {view === 'bottleneck' ? (
                    <BottleneckTable model={model} onOpenIssues={openIssues} />
                ) : (
                    <>
                        <IssueTimelineTable model={model} settings={settings} onSettingsChange={onSettingsChange} onAddWorklog={onAddWorklog} />
                        <div className="shrink-0">
                            <StatusLegend statuses={model.statuses} statusColors={model.statusColors} />
                        </div>
                    </>
                )}

                <OverlayPanel
                    isOpen={!!activeStatus}
                    target={activeStatus?.target ?? null}
                    onClose={closeIssues}
                    title={activeStatus ? [activeStatus.groupName, activeStatus.stats.status.name].filter(Boolean).join(' · ') : undefined}
                    width={380}
                    maxHeight={360}
                >
                    {activeStatus && <StatusIssueList stats={activeStatus.stats} dayLength={model.dayLength} />}
                </OverlayPanel>
            </div>
        );
    };

    return <div className="time-in-status flex h-full min-h-0 flex-col">{renderBody()}</div>;
}
