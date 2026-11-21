import type { ReactNode } from 'react';

interface DialogFieldProps {
    label: string;
    htmlFor?: string;
    helpText?: ReactNode;
    error?: string | null;
    children: ReactNode;
}

export default function DialogField({ label, htmlFor, helpText, error, children }: DialogFieldProps) {
    return (
        <div className="flex w-full min-w-0 flex-col gap-1.5">
            {htmlFor ? (
                <label htmlFor={htmlFor} className="text-sm font-semibold text-(--text-primary)">
                    {label}
                </label>
            ) : (
                <span className="text-sm font-semibold text-(--text-primary)">{label}</span>
            )}
            {children}
            {error && <span className="text-xs text-(--color-error)">{error}</span>}
            {!error && helpText && <span className="text-xs text-(--text-secondary)">{helpText}</span>}
        </div>
    );
}
