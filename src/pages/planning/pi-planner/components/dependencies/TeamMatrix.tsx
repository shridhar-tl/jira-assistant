import { useMemo } from 'react';

import classNames from 'classnames';

import type { TeamPairCount } from '../../pi-dependency-model';
import { dependencyHealthLabels } from '../../pi-progress';

interface TeamMatrixProps {
    pairs: TeamPairCount[];
    selected: TeamPairCount | null;
    onSelect: (pair: TeamPairCount | null) => void;
}

const cellClassNames: Record<TeamPairCount['worst'], string> = {
    late: 'bg-red-500 text-white',
    declined: 'bg-red-500 text-white',
    atRisk: 'bg-amber-400 text-amber-950',
    linkConflict: 'bg-amber-400 text-amber-950',
    awaiting: 'bg-slate-300 text-slate-900 dark:bg-slate-600 dark:text-white',
    onTrack: 'bg-sky-500 text-white',
    link: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100',
    delivered: 'bg-emerald-500 text-white',
};

const worstLabels: Record<TeamPairCount['worst'], string> = { ...dependencyHealthLabels, link: 'Issue links only', linkConflict: 'Issue link with a sprint conflict' };

const legend: Array<TeamPairCount['worst']> = ['late', 'atRisk', 'awaiting', 'onTrack', 'link', 'delivered'];

function pairTitle(pair: TeamPairCount): string {
    return `${pair.fromName} needs ${pair.toName}: ${pair.manual.length} team ${pair.manual.length === 1 ? 'dependency' : 'dependencies'}, ${pair.links.length} open issue ${pair.links.length === 1 ? 'link' : 'links'} · ${worstLabels[pair.worst]}`;
}

/** Which team waits on which: needing teams down the side, delivering teams across the top, coloured by the worst state between them. */
export default function TeamMatrix({ pairs, selected, onSelect }: TeamMatrixProps) {
    const { rows, columns, byKey } = useMemo(() => {
        const map = new Map(pairs.map((p) => [`${p.fromName}>${p.toName}`, p]));
        return {
            rows: [...new Set(pairs.map((p) => p.fromName))].sort(),
            columns: [...new Set(pairs.map((p) => p.toName))].sort(),
            byKey: map,
        };
    }, [pairs]);

    if (!pairs.length) {
        return null;
    }

    return (
        <section className="flex flex-col gap-2 rounded-lg border border-(--border-primary) p-3" aria-label="Team dependency matrix">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold">Who waits on whom</span>
                <span className="text-xs text-(--text-tertiary)">Rows need, columns deliver. Select a cell to see those items.</span>
                <span className="flex-1" />
                {legend.map((key) => (
                    <span key={key} className="inline-flex items-center gap-1 text-[11px] text-(--text-secondary)">
                        <span className={classNames('h-2.5 w-2.5 rounded-sm', cellClassNames[key])} />
                        {worstLabels[key]}
                    </span>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="border-separate border-spacing-1 text-xs">
                    <thead>
                        <tr>
                            <th className="sticky left-0 bg-(--bg-primary) px-2 text-left font-medium text-(--text-tertiary)">Needs ↓ / Delivers →</th>
                            {columns.map((name) => (
                                <th key={name} className="max-w-28 truncate px-1 text-center font-medium" title={name}>
                                    {name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((from) => (
                            <tr key={from}>
                                <th className="sticky left-0 max-w-40 truncate bg-(--bg-primary) px-2 text-left font-medium" title={from}>
                                    {from}
                                </th>
                                {columns.map((to) => {
                                    const pair = byKey.get(`${from}>${to}`);
                                    if (!pair) {
                                        return <td key={to} className="h-9 min-w-14 rounded bg-(--bg-secondary)" />;
                                    }
                                    const isSelected = selected?.fromName === from && selected.toName === to;
                                    return (
                                        <td key={to} className="h-9 min-w-14 p-0">
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                title={pairTitle(pair)}
                                                aria-pressed={isSelected}
                                                className={classNames(
                                                    'flex h-9 w-full cursor-pointer items-center justify-center gap-1 rounded font-semibold transition hover:opacity-85',
                                                    cellClassNames[pair.worst],
                                                    { 'ring-2 ring-(--text-primary) ring-offset-1': isSelected },
                                                )}
                                                onClick={() => onSelect(isSelected ? null : pair)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onSelect(isSelected ? null : pair);
                                                    }
                                                }}
                                            >
                                                {pair.manual.length > 0 && <span>{pair.manual.length}</span>}
                                                {pair.links.length > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 font-normal opacity-90">
                                                        <i className="fa fa-link text-[10px]" />
                                                        {pair.links.length}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
