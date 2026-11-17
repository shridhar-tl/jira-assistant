import type { ReactNode } from 'react';

import classNames from 'classnames';

interface PropertyRowProps {
    label: string;
    helpText?: ReactNode;
    className?: string;
    children: ReactNode;
}

export default function PropertyRow({ label, helpText, className, children }: PropertyRowProps) {
    return (
        <div className={classNames('flex min-w-0 flex-col gap-1.5', className)}>
            <span className="text-xs font-semibold text-(--text-secondary)">{label}</span>
            {children}
            {helpText && <span className="text-xs text-(--text-tertiary)">{helpText}</span>}
        </div>
    );
}
