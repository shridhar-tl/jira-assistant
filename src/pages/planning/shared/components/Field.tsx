import type { ReactNode } from 'react';

import classNames from 'classnames';

interface FieldProps {
    label: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}

export default function Field({ label, hint, children, className }: FieldProps) {
    return (
        <label className={classNames('flex min-w-0 flex-col gap-1', className)}>
            <span className="text-xs font-medium text-(--text-secondary)">{label}</span>
            {children}
            {hint && <span className="text-[11px] text-(--text-tertiary)">{hint}</span>}
        </label>
    );
}
