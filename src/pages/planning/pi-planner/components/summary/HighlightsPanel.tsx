import classNames from 'classnames';

import { Button } from '@components';

import type { Highlight, HighlightView } from '../../pi-summary-model';

interface HighlightsPanelProps {
    title: string;
    tone: 'good' | 'attention';
    items: Highlight[];
    emptyText: string;
    onNavigate?: (view: HighlightView) => void;
}

const toneClassNames = {
    good: { border: 'border-t-emerald-500', icon: 'fa fa-check-circle text-emerald-600 dark:text-emerald-400' },
    attention: { border: 'border-t-amber-500', icon: 'fa fa-exclamation-circle text-amber-600 dark:text-amber-400' },
};

export default function HighlightsPanel({ title, tone, items, emptyText, onNavigate }: HighlightsPanelProps) {
    const style = toneClassNames[tone];
    return (
        <section className={classNames('flex flex-col gap-2 rounded-lg border border-t-4 border-(--border-primary) bg-(--bg-primary) p-3', style.border)} aria-label={title}>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
                <i className={style.icon} />
                {title}
                <span className="rounded-full bg-(--bg-secondary) px-2 text-xs font-normal text-(--text-secondary)">{items.length}</span>
            </h3>
            {items.length ? (
                <ul className="flex flex-col divide-y divide-(--border-secondary)">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 py-1.5" data-highlight={item.id}>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm">{item.text}</span>
                                {item.detail && <span className="truncate text-xs text-(--text-secondary)" title={item.detail}>{item.detail}</span>}
                            </div>
                            {item.view && onNavigate && (
                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-arrow-right" />} ariaLabel={`Open ${item.view}`} title="Open" onClick={() => onNavigate(item.view as HighlightView)} />
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="text-xs text-(--text-tertiary)">{emptyText}</span>
            )}
        </section>
    );
}
