import type { ReactNode } from 'react';

import classNames from 'classnames';

import { Button } from '@components';

import SampleReportsSection from './SampleReportsSection';
import SavedReportsSection from './SavedReportsSection';
import type { ReportSampleCategory, SampleReportItem, SavedReportItem } from './types';

interface ReportGalleryProps {
    title: string;
    description: ReactNode;
    icon: string;
    savedReports?: SavedReportItem[];
    samples: SampleReportItem[];
    categories: ReportSampleCategory[];
    samplesHelpText?: ReactNode;
    onCreate: () => void;
    onOpenReport: (report: SavedReportItem) => void;
    onDeleteReport?: (report: SavedReportItem) => void;
    onOpenSample: (sample: SampleReportItem) => void;
}

export default function ReportGallery({
    title,
    description,
    icon,
    savedReports,
    samples,
    categories,
    samplesHelpText,
    onCreate,
    onOpenReport,
    onDeleteReport,
    onOpenSample,
}: ReportGalleryProps) {
    return (
        <div className="min-h-full bg-(--bg-secondary)">
            <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 p-4 sm:p-6">
                <header className="flex flex-col gap-4 rounded-2xl border border-(--border-primary) bg-(--bg-primary) p-4 sm:flex-row sm:items-center sm:p-6">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary-color)/10 text-xl text-(--primary-color)">
                        <i className={classNames('fa', icon)} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-semibold text-(--text-primary) sm:text-xl">{title}</h1>
                        <div className="mt-1 text-sm text-(--text-secondary)">{description}</div>
                    </div>
                    <Button
                        className="w-full justify-center sm:w-auto"
                        leftIcon={<i className="fa fa-plus" />}
                        label="Create new report"
                        onClick={onCreate}
                    />
                </header>

                <SavedReportsSection reports={savedReports} onCreate={onCreate} onOpen={onOpenReport} onDelete={onDeleteReport} />

                <SampleReportsSection samples={samples} categories={categories} helpText={samplesHelpText} onOpen={onOpenSample} />
            </div>
        </div>
    );
}
