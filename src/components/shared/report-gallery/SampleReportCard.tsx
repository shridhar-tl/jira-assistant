import { memo } from 'react';

import classNames from 'classnames';

import { Button } from '@components';

import ReportTagList from './ReportTagList';
import type { SampleReportItem } from './types';

interface SampleReportCardProps {
    sample: SampleReportItem;
    categoryLabel?: string;
    onOpen: (sample: SampleReportItem) => void;
}

function SampleReportCard({ sample, categoryLabel, onOpen }: SampleReportCardProps) {
    const { title, description, icon, tags } = sample;

    return (
        <article className="group relative flex min-w-0 flex-col gap-3 rounded-xl border border-(--border-primary) bg-(--bg-primary) p-4 transition-all hover:-translate-y-0.5 hover:border-(--primary-color) hover:shadow-md">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-(--primary-color) to-(--primary-color)/60 text-white shadow-sm">
                    <i className={classNames('fa', icon)} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
                    {categoryLabel && <span className="text-[11px] uppercase tracking-wide text-(--text-tertiary)">{categoryLabel}</span>}
                </div>
            </div>
            <p className="flex-1 text-xs leading-relaxed text-(--text-secondary)">{description}</p>
            <ReportTagList tags={tags} />
            <div className="flex justify-end border-t border-(--border-primary) pt-3">
                <Button
                    size="sm"
                    layout="outlined"
                    className="relative z-10"
                    leftIcon={<i className="fa fa-play" />}
                    label="Use this sample"
                    onClick={() => onOpen(sample)}
                />
            </div>
        </article>
    );
}

export default memo(SampleReportCard);
