import type { ReactNode } from 'react';

interface ViewToolbarProps {
    children?: ReactNode;
    actions?: ReactNode;
}

/** Summary on the left and the view's actions on the right; wraps on small screens. */
export default function ViewToolbar({ children, actions }: ViewToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-(--text-secondary)">{children}</div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
