import type { ReactNode } from 'react';

import classNames from 'classnames';

interface FieldProps {
    label: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
    /** For a control made of several buttons or inputs (a list, a select button), which a label would activate by its first button. */
    group?: boolean;
}

export default function Field({ label, hint, children, className, group }: FieldProps) {
    const content = (
        <>
            <span className="text-xs font-medium text-(--text-secondary)">{label}</span>
            {children}
            {hint && <span className="text-[11px] text-(--text-tertiary)">{hint}</span>}
        </>
    );
    const classes = classNames('flex min-w-0 flex-col gap-1', className);
    return group ? (
        <div role="group" aria-label={label} className={classes}>
            {content}
        </div>
    ) : (
        <label className={classes}>{content}</label>
    );
}
