import type { ReactNode } from 'react';

import { ReportInfoNote, ReportInfoSection } from '../shared';

interface TimeInStatusInfoProps {
    note?: ReactNode;
    noteTitle?: string;
}

const howToUseItems = [
    <>
        Click the <i className="fa fa-cogs" /> settings icon to choose the issues using a <strong>custom JQL</strong> or the members of
        your <strong>user groups</strong>.
    </>,
    <>
        Choose the <strong>period</strong> from the date range in the toolbar. Issues that were open at any time within it are included.
    </>,
    <>
        The <strong>Bottlenecks</strong> view lists the average, median and maximum time spent in each status. Click a status to see its
        issues.
    </>,
    <>
        The <strong>Issues</strong> view shows the status history of every issue as a timeline along with its lead time and cycle time.
    </>,
    'Group the bottlenecks by project, issue type, assignee, user group or any other field.',
    <>
        Turn on <strong>Count only working hours</strong> in settings to use the working days and hours from{' '}
        <strong>Settings &rarr; General</strong>.
    </>,
];

const whatsNewItems = [
    'Bottleneck view highlighting the in progress status where issues wait the longest.',
    'Lead time and cycle time based on Jira status categories, so it works across different workflows.',
    'Status timeline of every issue with the exact time spent in each status.',
    'Option to exclude non working hours and days from all the durations.',
    'Status history is cached on this device and fetched again only for the issues updated since the last run.',
];

export default function TimeInStatusInfo({ note, noteTitle }: TimeInStatusInfoProps) {
    return (
        <div className="min-h-0 flex-1 overflow-auto p-6 space-y-4">
            {note && <ReportInfoNote title={noteTitle}>{note}</ReportInfoNote>}
            <ReportInfoSection title="How to Use" icon="fa-info-circle" items={howToUseItems} defaultOpen />
            <ReportInfoSection title="What's New" icon="fa-star" variant="new" items={whatsNewItems} />
        </div>
    );
}
