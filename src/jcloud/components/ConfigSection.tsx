import type { ReactNode } from 'react';

import classNames from 'classnames';

interface ConfigSectionProps {
    icon: string;
    title: string;
    description?: string;
    children: ReactNode;
}

export default function ConfigSection({ icon, title, description, children }: ConfigSectionProps) {
    return (
        <section className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                <span className={classNames('fa w-4 text-center text-(--primary-color)', icon)} />
                {title}
            </h3>
            {description && <p className="mt-1 text-xs text-(--text-secondary)">{description}</p>}
            <div className="mt-3">{children}</div>
        </section>
    );
}
