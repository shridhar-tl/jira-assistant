import { useMemo, useState } from 'react';

import { ShimmerDiv, TextInput } from '@components';

import SavedReportCard from './SavedReportCard';
import type { SavedReportItem } from './types';

interface SavedReportsSectionProps {
    reports?: SavedReportItem[];
    onCreate: () => void;
    onOpen: (report: SavedReportItem) => void;
    onDelete?: (report: SavedReportItem) => void;
}

const minReportsForSearch = 6;
const loadingPlaceholders = [1, 2, 3];
const gridClassName = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

export default function SavedReportsSection({ reports, onCreate, onOpen, onDelete }: SavedReportsSectionProps) {
    const [searchText, setSearchText] = useState('');

    const filteredReports = useMemo(() => {
        const text = searchText.trim().toLowerCase();
        return text && reports ? reports.filter(({ name }) => name.toLowerCase().includes(text)) : reports;
    }, [reports, searchText]);

    const count = reports?.length || 0;

    return (
        <section className="flex flex-col gap-3" aria-labelledby="saved-reports-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <h2 id="saved-reports-heading" className="text-base font-semibold text-(--text-primary)">
                        My reports
                    </h2>
                    {!!count && <span className="rounded-full bg-(--bg-secondary) px-2 py-0.5 text-xs text-(--text-secondary)">{count}</span>}
                </div>
                {count >= minReportsForSearch && (
                    <div className="w-full sm:w-64">
                        <TextInput
                            value={searchText}
                            onChange={(e) => setSearchText(e.value)}
                            placeholder="Search my reports"
                            leftIcon={<i className="fa fa-search" />}
                            clearable
                            onClear={() => setSearchText('')}
                        />
                    </div>
                )}
            </div>

            <div className={gridClassName}>
                <button
                    type="button"
                    onClick={onCreate}
                    className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-(--border-primary) p-4 text-left text-(--text-secondary) transition-colors hover:border-(--primary-color) hover:text-(--primary-color)"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--bg-secondary)">
                        <i className="fa fa-plus" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold">Create new report</span>
                        <span className="block text-xs">Start from an empty report and design it yourself</span>
                    </span>
                </button>

                {!filteredReports && loadingPlaceholders.map((i) => <ShimmerDiv key={i} className="min-h-24 rounded-xl" />)}

                {filteredReports?.map((report) => (
                    <SavedReportCard key={report.id} report={report} onOpen={onOpen} onDelete={onDelete} />
                ))}
            </div>

            {reports && !count && (
                <p className="text-sm text-(--text-secondary)">
                    You have not saved any report yet. Create a new report or start from one of the sample reports below.
                </p>
            )}
            {!!count && !filteredReports?.length && (
                <p className="text-sm text-(--text-secondary)">No reports match &quot;{searchText.trim()}&quot;.</p>
            )}
        </section>
    );
}
