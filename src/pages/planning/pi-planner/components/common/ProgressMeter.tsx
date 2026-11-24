import { ProgressBar } from '@components';

import { formatMeasure, healthBarVariants, type DependencyHealth, type IssueProgress, type ObjectiveHealth } from '../../pi-progress';

interface ProgressMeterProps {
    progress: IssueProgress;
    health: ObjectiveHealth | DependencyHealth;
    expectedPercent?: number;
}

/** Done work against all work behind the linked issues, with the share expected by now marked on the bar. */
export default function ProgressMeter({ progress, health, expectedPercent }: ProgressMeterProps) {
    if (!progress.issueCount) {
        return <span className="text-xs text-(--text-tertiary)">No linked issues</span>;
    }
    const title = `${formatMeasure(progress.done, progress.measure)} of ${formatMeasure(progress.total, progress.measure)} done · ${progress.doneCount} of ${progress.issueCount} issues`;
    return (
        <div className="flex min-w-32 flex-col gap-0.5" title={title}>
            <div className="relative">
                <ProgressBar value={progress.percent} variant={healthBarVariants[health]} size="sm" ariaLabel={title} />
                {expectedPercent !== undefined && expectedPercent > 0 && expectedPercent < 100 && (
                    <span className="absolute -top-0.5 h-[calc(100%+4px)] w-0.5 rounded bg-(--text-secondary)" style={{ left: `${expectedPercent}%` }} title={`${expectedPercent}% expected by now`} />
                )}
            </div>
            <div className="flex justify-between gap-2 text-[11px] text-(--text-secondary)">
                <span>{progress.percent}% done</span>
                <span>
                    {progress.doneCount}/{progress.issueCount} issues
                </span>
            </div>
        </div>
    );
}
