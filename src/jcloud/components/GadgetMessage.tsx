import classNames from 'classnames';

interface GadgetMessageProps {
    icon: string;
    text: string;
    title?: string;
    spin?: boolean;
    variant?: 'info' | 'error';
}

export default function GadgetMessage({ icon, text, title, spin, variant = 'info' }: GadgetMessageProps) {
    const isError = variant === 'error';

    return (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-6 text-center">
            <span
                className={classNames('fa', icon, 'text-2xl', {
                    'fa-spin': spin,
                    'text-(--text-tertiary)': !isError,
                    'text-red-600 dark:text-red-400': isError,
                })}
            />
            {title && <div className="text-sm font-semibold text-(--text-primary)">{title}</div>}
            <div className="max-w-80 text-sm text-(--text-secondary)">{text}</div>
        </div>
    );
}
