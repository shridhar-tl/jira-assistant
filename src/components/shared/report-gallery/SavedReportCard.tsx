import { memo } from 'react';

import { formatDistanceToNow } from 'date-fns';

import { Button } from '@components';

import ReportTagList from './ReportTagList';
import type { SavedReportItem } from './types';

interface SavedReportCardProps {
    report: SavedReportItem;
    onOpen: (report: SavedReportItem) => void;
    onDelete?: (report: SavedReportItem) => void;
}

function toRelativeDate(value?: Date | string) {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : { text: formatDistanceToNow(date, { addSuffix: true }), title: date.toLocaleString() };
}

function SavedReportCard({ report, onOpen, onDelete }: SavedReportCardProps) {
    const { name, tags, dateCreated, dateUpdated } = report;
    const created = toRelativeDate(dateCreated);
    const updated = toRelativeDate(dateUpdated);

    return (
        <article className="group relative flex min-w-0 flex-col gap-3 rounded-xl border border-(--border-primary) bg-(--bg-primary) p-4 transition-all hover:-translate-y-0.5 hover:border-(--primary-color) hover:shadow-md">
            <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--primary-color)/10 text-(--primary-color)">
                    <i className="fa fa-table-cells" />
                </span>
                <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer text-left after:absolute after:inset-0 after:content-['']"
                    onClick={() => onOpen(report)}
                    title={`Open "${name}"`}
                >
                    <h3 className="truncate text-sm font-semibold text-(--text-primary)">{name}</h3>
                    <p className="mt-0.5 truncate text-xs text-(--text-secondary)">
                        {created && <span title={created.title}>Created {created.text}</span>}
                        {updated && (
                            <span title={updated.title}>
                                {created ? ' · ' : ''}Updated {updated.text}
                            </span>
                        )}
                    </p>
                </button>
                {onDelete && (
                    <Button
                        layout="plain"
                        size="sm"
                        className="relative z-10 text-(--color-error) opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                        leftIcon={<i className="fa fa-trash" />}
                        title={`Delete "${name}"`}
                        ariaLabel={`Delete "${name}"`}
                        onClick={() => onDelete(report)}
                    />
                )}
            </div>
            <ReportTagList tags={tags} />
        </article>
    );
}

export default memo(SavedReportCard);
