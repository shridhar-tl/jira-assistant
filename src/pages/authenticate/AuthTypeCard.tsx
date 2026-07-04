import type { ReactNode } from 'react';

import classNames from 'classnames';

interface AuthTypeCardProps {
    title: string;
    description?: string;
    icon: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    testId?: string;
    children?: ReactNode;
    badge?: ReactNode;
    accentColor?: string;
}

function AuthTypeCard({ title, description, icon, onClick, disabled, testId, children, badge, accentColor = 'blue' }: AuthTypeCardProps) {
    const colorMap: Record<string, { bg: string; border: string; hoverBg: string; iconBg: string; iconText: string }> = {
        blue: {
            bg: 'hover:bg-blue-50/70 dark:hover:bg-blue-950/20',
            border: 'hover:border-blue-400 dark:hover:border-blue-500',
            hoverBg: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40',
            iconBg: 'bg-blue-50 dark:bg-blue-950/30',
            iconText: 'text-blue-600 dark:text-blue-400',
        },
        green: {
            bg: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20',
            border: 'hover:border-emerald-400 dark:hover:border-emerald-500',
            hoverBg: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40',
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
            iconText: 'text-emerald-600 dark:text-emerald-400',
        },
        purple: {
            bg: 'hover:bg-purple-50/70 dark:hover:bg-purple-950/20',
            border: 'hover:border-purple-400 dark:hover:border-purple-500',
            hoverBg: 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40',
            iconBg: 'bg-purple-50 dark:bg-purple-950/30',
            iconText: 'text-purple-600 dark:text-purple-400',
        },
        amber: {
            bg: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/20',
            border: 'hover:border-amber-400 dark:hover:border-amber-500',
            hoverBg: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40',
            iconBg: 'bg-amber-50 dark:bg-amber-950/30',
            iconText: 'text-amber-600 dark:text-amber-400',
        },
    };

    const colors = colorMap[accentColor] || colorMap.blue;

    return (
        <div
            className={classNames(
                'group relative w-full rounded-xl p-4 mb-3 transition-all duration-250 border',
                'border-[var(--border-primary)]',
                disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${colors.bg} ${colors.border} hover:shadow-[var(--shadow-md)]`,
            )}
            onClick={disabled ? undefined : onClick}
            data-test-id={testId}
        >
            {badge && <div className="absolute right-3 top-3 z-10">{badge}</div>}
            <div className="flex items-start gap-4">
                <div
                    className={classNames(
                        'shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors duration-250',
                        colors.iconBg,
                        colors.iconText,
                        !disabled && colors.hoverBg,
                    )}
                >
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-0.5 leading-tight">{title}</h3>
                    {description && <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{description}</p>}
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthTypeCard;
