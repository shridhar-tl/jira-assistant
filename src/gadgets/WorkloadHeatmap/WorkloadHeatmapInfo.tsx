import type { ReactNode } from 'react';

import { ReportInfoNote, ReportInfoSection } from '../shared';

import { howItWorks } from './constants';

interface WorkloadHeatmapInfoProps {
    note?: ReactNode;
}

const howToUseItems = [
    <>
        Click the <i className="fa fa-users" /> icon to choose the users and groups whose workload should be shown.
    </>,
    <>
        Click the <i className="fa fa-cogs" /> settings icon to use a custom JQL instead, change the date range or the work week.
    </>,
    'Hover on any cell to see the issues planned for that person on that day.',
    ...howItWorks,
];

export default function WorkloadHeatmapInfo({ note }: WorkloadHeatmapInfoProps) {
    return (
        <div className="min-h-0 flex-1 overflow-auto p-6 space-y-4 widget:p-0">
            {note && <ReportInfoNote>{note}</ReportInfoNote>}
            <ReportInfoSection title="How to Use" icon="fa-info-circle" items={howToUseItems} defaultOpen />
        </div>
    );
}
