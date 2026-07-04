import { ScrollableTable, THead, TBody } from '@components';

interface SummaryView1Props {
    sprintDetails: any[];
    formatDateTime: (val: string) => string;
}

function SPChangeIndicator({ oldVal, newVal }: { oldVal?: number; newVal?: number | string }) {
    return (
        <>
            {oldVal && (
                <span className="text-amber-500 mr-1">
                    {oldVal} <i className="fa fa-arrow-right text-xs" />
                </span>
            )}
            {newVal}
        </>
    );
}

function SummaryView1({ sprintDetails, formatDateTime }: SummaryView1Props) {
    return (
        <ScrollableTable dataset={sprintDetails} className="text-center text-sm" exportSheetName="Summary view 1">
            <THead>
                <tr>
                    <th
                        rowSpan={2}
                        colSpan={2}
                        className="px-3 py-2 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10"
                    >
                        Sprint details
                    </th>
                    <th
                        colSpan={sprintDetails.length}
                        className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center"
                    >
                        Sprints
                    </th>
                </tr>
                <tr>
                    {sprintDetails.map((sprint, i) => (
                        <th
                            key={i}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[180px] text-center"
                        >
                            {sprint.sprint.name}
                        </th>
                    ))}
                </tr>
            </THead>
            <TBody>
                <tr className="border-b border-(--border-color) hover:bg-(--bg-hover)">
                    <td colSpan={2} className="px-3 py-2 text-left font-medium">
                        Start date
                    </td>
                    {sprintDetails.map((sprint, i) => (
                        <td key={i} className="px-3 py-2">
                            {formatDateTime(sprint.sprint.startDate)}
                        </td>
                    ))}
                </tr>
                <tr className="border-b border-(--border-color) hover:bg-(--bg-hover)">
                    <td colSpan={2} className="px-3 py-2 text-left font-medium">
                        Completed date
                    </td>
                    {sprintDetails.map((sprint, i) => (
                        <td key={i} className="px-3 py-2">
                            {formatDateTime(sprint.sprint.completeDate)}
                        </td>
                    ))}
                </tr>
                <tr className="border-b border-(--border-color) hover:bg-(--bg-hover)">
                    <td colSpan={2} className="px-3 py-2 text-left font-medium">
                        Current status
                    </td>
                    {sprintDetails.map((sprint, i) => (
                        <td key={i} className="px-3 py-2">
                            <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sprint.sprint.state === 'closed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                            >
                                {sprint.sprint.state}
                            </span>
                        </td>
                    ))}
                </tr>
                <tr className="border-b-2 border-(--border-color) hover:bg-(--bg-hover)">
                    <td colSpan={2} className="px-3 py-2 text-left font-medium">
                        Closed by
                    </td>
                    {sprintDetails.map((sprint, i) => (
                        <td key={i} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: sprint.lastUserToClose || '' }} />
                    ))}
                </tr>

                <SectionRows
                    label="Estimated"
                    sprintDetails={sprintDetails}
                    spField="estimateIssuesSP"
                    spOldField="estimateIssuesSPOld"
                    withSPField="estimateIssuesWithSP"
                    countField="estimateIssuesCount"
                />

                <SectionRows
                    label="Total"
                    sprintDetails={sprintDetails}
                    spField="totalIssuesSP"
                    spOldField="totalIssuesSPOld"
                    withSPField="totalIssuesWithSP"
                    countField="totalIssuesCount"
                />

                <SectionRows
                    label="Completed"
                    sprintDetails={sprintDetails}
                    spField="completedSP"
                    spOldField="completedSPOld"
                    withSPField="completedWithSP"
                    countField="CompletedTotal"
                />

                <SectionRows
                    label="Not completed"
                    sprintDetails={sprintDetails}
                    spField="incompletedSP"
                    spOldField="incompletedSPOld"
                    withSPField="incompletedWithSP"
                    countField="incompletedTotal"
                />

                <SectionRows
                    label="Added to sprint"
                    sprintDetails={sprintDetails}
                    spField="addedSP"
                    spOldField="addedSPOld"
                    withSPField="addedWithSP"
                    countField="addedIssues"
                />

                <SectionRows
                    label="Removed from sprint"
                    sprintDetails={sprintDetails}
                    spField="removedSP"
                    spOldField="removedSPOld"
                    withSPField="removedWithSP"
                    countField="removedTotal"
                    isLast
                />
            </TBody>
        </ScrollableTable>
    );
}

interface SectionRowsProps {
    label: string;
    sprintDetails: any[];
    spField: string;
    spOldField: string;
    withSPField: string;
    countField: string;
    isLast?: boolean;
}

function SectionRows({ label, sprintDetails, spField, spOldField, withSPField, countField, isLast }: SectionRowsProps) {
    const borderClass = isLast ? '' : 'border-b-2 border-(--border-color)';
    const sectionColor = getSectionColor(label);

    return (
        <>
            <tr className="border-b border-(--border-color)/50 hover:bg-(--bg-hover)">
                <td rowSpan={4} className={`px-3 py-2 font-semibold text-left ${borderClass} ${sectionColor} w-36 align-middle`}>
                    {label}
                </td>
                <td className="px-3 py-2 text-left text-secondary text-xs">Story points</td>
                {sprintDetails.map((sprint, i) => (
                    <td key={i} className="px-3 py-2 font-medium">
                        <SPChangeIndicator oldVal={sprint[spOldField]} newVal={sprint[spField]} />
                    </td>
                ))}
            </tr>
            <tr className="border-b border-(--border-color)/50 hover:bg-(--bg-hover)">
                <td className="px-3 py-2 text-left text-secondary text-xs">Tickets with SP</td>
                {sprintDetails.map((sprint, i) => (
                    <td key={i} className="px-3 py-2">
                        {sprint[withSPField]}
                    </td>
                ))}
            </tr>
            <tr className="border-b border-(--border-color)/50 hover:bg-(--bg-hover)">
                <td className="px-3 py-2 text-left text-secondary text-xs">Tickets without SP</td>
                {sprintDetails.map((sprint, i) => (
                    <td key={i} className="px-3 py-2">
                        {sprint[countField] - sprint[withSPField]}
                    </td>
                ))}
            </tr>
            <tr className={`${borderClass} hover:bg-(--bg-hover)`}>
                <td className="px-3 py-2 text-left text-secondary text-xs font-medium">Total tickets</td>
                {sprintDetails.map((sprint, i) => (
                    <td key={i} className="px-3 py-2 font-semibold">
                        {sprint[countField]}
                    </td>
                ))}
            </tr>
        </>
    );
}

function getSectionColor(label: string): string {
    switch (label) {
        case 'Estimated':
            return 'text-indigo-600';
        case 'Total':
            return 'text-purple-600';
        case 'Completed':
            return 'text-green-600';
        case 'Not completed':
            return 'text-red-500';
        case 'Added to sprint':
            return 'text-amber-600';
        case 'Removed from sprint':
            return 'text-orange-600';
        default:
            return '';
    }
}

export default SummaryView1;
