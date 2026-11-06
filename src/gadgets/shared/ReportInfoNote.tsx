import type { ReactNode } from 'react';

interface ReportInfoNoteProps {
    children: ReactNode;
    title?: string;
    icon?: string;
}

export default function ReportInfoNote({ children, title = 'Note:', icon = 'fa-exclamation-triangle' }: ReportInfoNoteProps) {
    return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-3">
            <div className="flex gap-2 text-sm text-amber-800 dark:text-amber-200">
                <i className={`fa ${icon} mt-0.5 shrink-0`} />
                <div className="min-w-0 flex-1">
                    {title && <strong>{title}</strong>} {children}
                </div>
            </div>
        </div>
    );
}
