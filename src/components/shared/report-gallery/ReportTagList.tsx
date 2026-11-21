import classNames from 'classnames';

import type { ReportTag, ReportTagTone } from './types';

interface ReportTagListProps {
    tags: ReportTag[];
}

const toneClasses: Record<ReportTagTone, string> = {
    default: 'border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary)',
    info: 'border-(--primary-color)/30 bg-(--primary-color)/10 text-(--primary-color)',
    warning: 'border-(--color-warning)/40 bg-(--color-warning)/10 text-(--color-warning)',
};

export default function ReportTagList({ tags }: ReportTagListProps) {
    if (!tags.length) {
        return null;
    }

    return (
        <ul className="flex flex-wrap gap-1.5">
            {tags.map(({ icon, label, title, tone = 'default' }) => (
                <li
                    key={`${icon}|${label}`}
                    title={title}
                    className={classNames('inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', toneClasses[tone])}
                >
                    <i className={classNames('fa shrink-0', icon)} />
                    <span className="truncate">{label}</span>
                </li>
            ))}
        </ul>
    );
}
