import classNames from 'classnames';

import type { MenuItem } from '@/constants/navigation';

interface MenuBadgeProps {
    badge: NonNullable<MenuItem['badge']>;
}

export default function MenuBadge({ badge }: MenuBadgeProps) {
    return (
        <span
            className={classNames('px-1.5 py-0.5 text-[10px] font-semibold rounded-full leading-tight', {
                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': badge.variant === 'info',
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300': badge.variant === 'success',
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': badge.variant === 'danger',
            })}
        >
            {badge.text}
        </span>
    );
}
