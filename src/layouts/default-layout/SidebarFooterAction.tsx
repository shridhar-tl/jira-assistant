import { memo } from 'react';

import { Link } from 'react-router';

import classNames from 'classnames';

export type SidebarFooterTone = 'accent' | 'red';

interface SidebarFooterActionProps {
    icon: string;
    label: string;
    tone?: SidebarFooterTone;
    isActive?: boolean;
    isHidden?: boolean;
    to?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    hasPopup?: boolean;
}

const toneClasses: Record<SidebarFooterTone, { idle: string; active: string }> = {
    accent: {
        idle: 'group-hover/action:text-(--sidebar-accent) group-focus-visible/action:text-(--sidebar-accent)',
        active: 'text-(--sidebar-accent)',
    },
    red: {
        idle: 'group-hover/action:text-red-500 group-focus-visible/action:text-red-500',
        active: 'text-red-500',
    },
};

function SidebarFooterAction({ icon, label, tone = 'accent', isActive, isHidden, to, onClick, hasPopup }: SidebarFooterActionProps) {
    const className = classNames(
        'group/action relative flex items-center shrink-0 h-8 p-0 m-0 border-0 rounded-full no-underline cursor-pointer select-none',
        'transition-[background-color,box-shadow,opacity,visibility] duration-200',
        'hover:bg-(--sidebar-hover) focus-visible:bg-(--sidebar-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sidebar-accent)/40',
        {
            'bg-(--sidebar-hover) shadow-sm': isActive,
            'bg-transparent': !isActive,
            'opacity-0 invisible pointer-events-none': isHidden,
        },
    );

    const content = (
        <>
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
                <i
                    className={classNames(
                        icon,
                        'text-[14px] transition-[color,transform] duration-200 group-hover/action:scale-110',
                        isActive ? toneClasses[tone].active : ['text-(--sidebar-icon)', toneClasses[tone].idle],
                    )}
                />
            </span>
            <span
                className={classNames(
                    'max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[12px] font-medium leading-none text-(--sidebar-text)',
                    'transition-[max-width,opacity,padding] duration-200 ease-out',
                    'group-hover/action:max-w-28 group-hover/action:opacity-100 group-hover/action:pr-3',
                    'group-focus-visible/action:max-w-28 group-focus-visible/action:opacity-100 group-focus-visible/action:pr-3',
                )}
            >
                {label}
            </span>
        </>
    );

    if (to) {
        return (
            <Link to={to} className={className} aria-label={label} aria-current={isActive ? 'page' : undefined}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={className}
            onClick={onClick}
            aria-label={label}
            aria-haspopup={hasPopup ? 'dialog' : undefined}
            aria-expanded={hasPopup ? !!isActive : undefined}
        >
            {content}
        </button>
    );
}

export default memo(SidebarFooterAction);
