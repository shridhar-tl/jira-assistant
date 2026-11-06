import type { ReactNode } from 'react';

import classNames from 'classnames';

export type ReportInfoSectionVariant = 'info' | 'new';

interface ReportInfoSectionProps {
    title: string;
    icon: string;
    items: ReactNode[];
    variant?: ReportInfoSectionVariant;
    defaultOpen?: boolean;
}

const variantClassNames: Record<ReportInfoSectionVariant, { border: string; summary: string; body: string; bullet: string }> = {
    info: {
        border: 'border-blue-200 dark:border-blue-800',
        summary: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-800 dark:text-blue-300',
        body: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
        bullet: 'text-blue-400',
    },
    new: {
        border: 'border-emerald-200 dark:border-emerald-800',
        summary:
            'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300',
        body: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
        bullet: 'text-emerald-400',
    },
};

export default function ReportInfoSection({ title, icon, items, variant = 'info', defaultOpen }: ReportInfoSectionProps) {
    const styles = variantClassNames[variant];

    return (
        <details className={classNames('group rounded-xl border overflow-hidden', styles.border)} open={defaultOpen}>
            <summary
                className={classNames(
                    'flex items-center gap-2 px-5 py-3 cursor-pointer text-sm font-semibold transition-colors list-none [&::-webkit-details-marker]:hidden',
                    styles.summary,
                )}
            >
                <i className={`fa ${icon}`} />
                <span>{title}</span>
                <i className="fa fa-chevron-right text-xs ml-auto transition-transform group-open:rotate-90" />
            </summary>
            <div className={classNames('px-5 py-4 border-t', styles.body)}>
                <ul className="space-y-2 text-sm text-secondary">
                    {items.map((item, index) => (
                        <li key={index} className="flex gap-2">
                            <i className={classNames('fa fa-circle text-[4px] mt-2 shrink-0', styles.bullet)} />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
