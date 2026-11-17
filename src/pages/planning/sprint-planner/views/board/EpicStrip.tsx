import { useMemo } from 'react';

import classNames from 'classnames';
import { isAfter } from 'date-fns';

import { backlogColumnId } from '../../../shared/board-loader';
import { getContrastText, getParentColor } from '../../../shared/colors';
import { getIssueHours, getIssuePoints } from '../../../shared/capacity';
import { formatNumber, formatShortDate } from '../../../shared/format';
import type { BoardModel } from '../../useBoardModel';
import { noParentFilterValue } from '../../useBoardModel';

interface EpicStripProps {
    model: BoardModel;
    columnIds: string[];
    columnTitles: Record<string, string>;
    highlighted: string | null;
    onHighlight: (parentKey: string | null) => void;
}

interface ParentRow {
    key: string;
    summary: string;
    color: string;
    done: boolean;
    first: number;
    last: number;
    counts: number[];
    doneEstimate: number;
    totalEstimate: number;
    overrun: boolean;
    dueDate: Date | null;
}

export default function EpicStrip({ model, columnIds, columnTitles, highlighted, onHighlight }: EpicStripProps) {
    const { data } = model;

    const rows = useMemo(() => {
        const map = new Map<string, ParentRow>();
        columnIds.forEach((columnId, columnIndex) => {
            for (const key of data.columns[columnId] || []) {
                const issue = data.issues[key];
                if (!issue || issue.isSubtask) {
                    continue;
                }
                const parentKey = issue.epicKey || issue.parentKey || noParentFilterValue;
                let row = map.get(parentKey);
                if (!row) {
                    const parent = data.parents[parentKey];
                    row = {
                        key: parentKey,
                        summary: parentKey === noParentFilterValue ? 'No parent' : parent?.summary || issue.parent?.summary || parentKey,
                        color: parentKey === noParentFilterValue ? '#94a3b8' : getParentColor(parentKey, parent?.color),
                        done: parent?.statusCategory === 'done',
                        first: columnIndex,
                        last: columnIndex,
                        counts: columnIds.map(() => 0),
                        doneEstimate: 0,
                        totalEstimate: 0,
                        overrun: false,
                        dueDate: parent?.dueDate || null,
                    };
                    map.set(parentKey, row);
                }
                row.first = Math.min(row.first, columnIndex);
                row.last = Math.max(row.last, columnIndex);
                row.counts[columnIndex]++;
                const size = data.estimateUnit === 'hours' ? getIssueHours(issue) : getIssuePoints(issue, data.estimateUnit);
                row.totalEstimate += size;
                if (issue.statusCategory === 'done') {
                    row.doneEstimate += size;
                }
            }
        });

        const sprintEnds = columnIds.map((id) => (id === backlogColumnId ? null : data.sprintRanges.get(Number(id))?.end || null));
        for (const row of map.values()) {
            const lastEnd = sprintEnds[row.last];
            row.overrun = !!row.dueDate && (row.last === columnIds.indexOf(backlogColumnId) || (!!lastEnd && isAfter(lastEnd, row.dueDate)));
        }

        return [...map.values()].sort((a, b) => a.first - b.first || a.last - b.last || a.summary.localeCompare(b.summary));
    }, [data, columnIds]);

    if (!rows.length) {
        return null;
    }

    const gridTemplateColumns = `minmax(140px, 220px) repeat(${columnIds.length}, minmax(72px, 1fr))`;

    return (
        <div className="h-full min-h-0 overflow-auto bg-(--bg-secondary) px-2 py-1.5">
            <div className="grid min-w-max items-center gap-x-1 gap-y-1 text-[11px]" style={{ gridTemplateColumns }}>
                <div className="sticky top-0 left-0 z-30 bg-(--bg-secondary) font-semibold shadow-[0_0_0_4px_var(--bg-secondary),1px_0_0_4px_var(--border-primary)] text-(--text-secondary)">Parents</div>
                {columnIds.map((id) => (
                    <div key={id} className="sticky top-0 z-20 truncate bg-(--bg-secondary) text-center font-medium text-(--text-secondary) shadow-[0_0_0_4px_var(--bg-secondary)]" title={columnTitles[id]}>
                        {columnTitles[id]}
                    </div>
                ))}
                {rows.map((row) => {
                    const progress = row.totalEstimate > 0 ? Math.round((row.doneEstimate * 100) / row.totalEstimate) : 0;
                    const isHighlighted = highlighted === row.key;
                    return (
                        <div key={row.key} className="contents">
                            <button
                                type="button"
                                className={classNames('sticky left-0 z-10 flex min-w-0 cursor-pointer items-center gap-1 bg-(--bg-secondary) text-left shadow-[0_0_0_4px_var(--bg-secondary),1px_0_0_4px_var(--border-primary)]', {
                                    'font-semibold text-(--color-primary-600)': isHighlighted,
                                })}
                                onClick={() => onHighlight(isHighlighted ? null : row.key)}
                                title={`${row.key === noParentFilterValue ? '' : `${row.key} `}${row.summary}${row.dueDate ? ` · due ${formatShortDate(row.dueDate)}` : ''}`}
                            >
                                {row.overrun && <i className="fa fa-exclamation-triangle text-amber-500" title="The parent is due before the last sprint that holds its children" />}
                                <span className={classNames('truncate', { 'line-through': row.done })}>{row.summary}</span>
                            </button>
                            {columnIds.map((id, index) => {
                                if (index < row.first || index > row.last) {
                                    return <div key={id} />;
                                }
                                const isStart = index === row.first;
                                const isEnd = index === row.last;
                                return (
                                    <button
                                        type="button"
                                        key={id}
                                        className={classNames('relative h-5 cursor-pointer overflow-hidden text-center leading-5', {
                                            'rounded-l-full': isStart,
                                            'rounded-r-full': isEnd,
                                            'ring-2 ring-amber-400': isHighlighted,
                                            'line-through': row.done,
                                        })}
                                        style={{ backgroundColor: row.color, color: getContrastText(row.color) }}
                                        onClick={() => onHighlight(isHighlighted ? null : row.key)}
                                        title={`${row.summary}: ${row.counts[index]} issues in ${columnTitles[id]} · ${progress}% done (${formatNumber(row.doneEstimate)}/${formatNumber(row.totalEstimate)})`}
                                    >
                                        {row.counts[index] > 0 ? row.counts[index] : ''}
                                        {isEnd && row.totalEstimate > 0 && (
                                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black/30" style={{ width: `${progress}%` }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
