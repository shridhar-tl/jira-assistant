import { useMemo, useState, type ReactNode } from 'react';

import classNames from 'classnames';

import SampleReportCard from './SampleReportCard';
import type { ReportSampleCategory, SampleReportItem } from './types';

interface SampleReportsSectionProps {
    samples: SampleReportItem[];
    categories: ReportSampleCategory[];
    helpText?: ReactNode;
    onOpen: (sample: SampleReportItem) => void;
}

const allCategories = 'all';

export default function SampleReportsSection({ samples, categories, helpText, onOpen }: SampleReportsSectionProps) {
    const [category, setCategory] = useState(allCategories);

    const categoryLabels = useMemo(() => Object.fromEntries(categories.map(({ id, label }) => [id, label])), [categories]);
    const usedCategories = useMemo(() => categories.filter(({ id }) => samples.some((s) => s.category === id)), [categories, samples]);
    const visibleSamples = useMemo(
        () => (category === allCategories ? samples : samples.filter((s) => s.category === category)),
        [samples, category],
    );

    const filterItems = [{ id: allCategories, label: 'All', icon: 'fa-border-all' }, ...usedCategories];

    return (
        <section className="flex flex-col gap-3" aria-labelledby="sample-reports-heading">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h2 id="sample-reports-heading" className="text-base font-semibold text-(--text-primary)">
                        Sample reports
                    </h2>
                    <span className="rounded-full bg-(--bg-secondary) px-2 py-0.5 text-xs text-(--text-secondary)">{samples.length}</span>
                </div>
                {helpText && <div className="text-xs text-(--text-secondary)">{helpText}</div>}
            </div>

            {usedCategories.length > 1 && (
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sample categories">
                    {filterItems.map(({ id, label, icon }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={category === id}
                            onClick={() => setCategory(id)}
                            className={classNames(
                                'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                                category === id
                                    ? 'border-(--primary-color) bg-(--primary-color) text-white'
                                    : 'border-(--border-primary) bg-(--bg-primary) text-(--text-secondary) hover:border-(--primary-color) hover:text-(--primary-color)',
                            )}
                        >
                            <i className={classNames('fa', icon)} />
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleSamples.map((sample) => (
                    <SampleReportCard key={sample.id} sample={sample} categoryLabel={categoryLabels[sample.category]} onOpen={onOpen} />
                ))}
            </div>
        </section>
    );
}
