import type { ReactNode } from 'react';

import classNames from 'classnames';

export type GadgetAlertVariant = 'error' | 'warning';

interface GadgetAlertProps {
    children: ReactNode;
    variant?: GadgetAlertVariant;
    action?: ReactNode;
    className?: string;
}

const variantClassNames: Record<GadgetAlertVariant, string> = {
    error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
};

export default function GadgetAlert({ children, variant = 'error', action, className = 'm-3' }: GadgetAlertProps) {
    return (
        <div
            className={classNames(
                'flex flex-col items-start gap-2 rounded-md border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between',
                variantClassNames[variant],
                className,
            )}
        >
            <span className="min-w-0">
                <i className="fa fa-exclamation-triangle me-2" />
                {children}
            </span>
            {action}
        </div>
    );
}
