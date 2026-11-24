import type { ReactNode } from 'react';

import classNames from 'classnames';

interface VizPanelProps {
    title: string;
    meta?: ReactNode;
    accentClass: string;
    className?: string;
    footer?: ReactNode;
    children: ReactNode;
}

function VizPanel({ title, meta, accentClass, className, footer, children }: VizPanelProps) {
    return (
        <section className={classNames('viz-panel @container flex min-w-0 flex-col rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 sm:p-4', className)}>
            <header className="mb-2 flex items-center gap-2 px-2">
                <span className={classNames('h-2.5 w-2.5 shrink-0 rounded-full', accentClass)} />
                <h4 className="viz-panel-title m-0 flex-1 truncate text-sm font-semibold text-(--text-primary)">{title}</h4>
                {meta && <span className="viz-panel-meta shrink-0 text-xs text-(--text-secondary)">{meta}</span>}
            </header>
            {children}
            {footer && <div className="mt-2 flex justify-center">{footer}</div>}
        </section>
    );
}

export default VizPanel;
