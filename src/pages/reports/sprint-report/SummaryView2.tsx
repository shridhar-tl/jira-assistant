import { Fragment, useCallback, useState } from 'react';

import classNames from 'classnames';

import { ScrollableTable, THead, TBody } from '@components';

interface SummaryView2Props {
    sprintDetails: any[];
    formatDateTime: (val: string) => string;
}

const helpTitle = 'Ticket with storypoints + Ticket without storypoints = Total story count';

function SummaryView2({ sprintDetails, formatDateTime }: SummaryView2Props) {
    return (
        <>
            <div className="p-4 text-sm text-secondary">
                <strong>Notes:</strong>
                <ul className="list-disc pl-6 mt-1 space-y-0.5">
                    <li>* Tickets highlighted below are changes in scope of the sprint</li>
                    <li>
                        Count of tickets format: Count of tickets with storypoints + Count of tickets without storypoints = Total count of
                        tickets
                    </li>
                </ul>
            </div>
            <ScrollableTable className="text-sm" exportSheetName="Summary view 2">
                <THead>
                    <tr>
                        <th
                            rowSpan={2}
                            className="px-3 py-2 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[160px]"
                        >
                            Sprint
                        </th>
                        <th
                            rowSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[120px]"
                        >
                            Start Date
                        </th>
                        <th
                            rowSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[120px]"
                        >
                            Completed Date
                        </th>
                        <th
                            rowSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[80px]"
                        >
                            Status
                        </th>
                        <th
                            rowSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[100px]"
                        >
                            Closed by
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-indigo-500/10"
                        >
                            Estimated
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-purple-500/10"
                        >
                            Total Issues
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-green-500/10"
                        >
                            Completed Issues
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-red-500/10"
                        >
                            Issues Not Completed
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-amber-500/10"
                        >
                            Added to sprint
                        </th>
                        <th
                            colSpan={2}
                            className="px-3 py-2 font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 text-center bg-orange-500/10"
                        >
                            Removed from sprint
                        </th>
                    </tr>
                    <tr>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            SP
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-secondary border-b border-(--border-color) bg-(--bg-secondary)">
                            Count <i className="fa fa-question-circle opacity-50" title={helpTitle} />
                        </th>
                    </tr>
                </THead>
                <TBody>
                    {sprintDetails.map((sprint, i) => (
                        <SprintDetailsRow key={i} sprint={sprint} formatDateTime={formatDateTime} />
                    ))}
                </TBody>
            </ScrollableTable>
        </>
    );
}

interface SprintDetailsRowProps {
    sprint: any;
    formatDateTime: (val: string) => string;
}

function SprintDetailsRow({ sprint, formatDateTime }: SprintDetailsRowProps) {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

    const cellClass = 'px-2 py-2 text-center';

    return (
        <>
            <tr
                className="border-b border-(--border-color) cursor-pointer hover:bg-(--bg-hover) transition-colors"
                onClick={toggleExpanded}
                title="Click to expand and view individual ticket details"
            >
                <td className="px-3 py-2 text-left font-medium">
                    <div className="flex items-center gap-2">
                        <i
                            className={classNames(
                                'fa transition-transform',
                                expanded ? 'fa-chevron-circle-down text-blue-500' : 'fa-chevron-circle-right text-secondary',
                            )}
                        />
                        <span>{sprint.sprint.name}</span>
                    </div>
                </td>
                <td className="px-3 py-2 text-center text-xs">{formatDateTime(sprint.sprint.startDate)}</td>
                <td className="px-3 py-2 text-center text-xs">{formatDateTime(sprint.sprint.completeDate)}</td>
                <td className="px-3 py-2 text-center">
                    <span
                        className={classNames(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                            sprint.sprint.state === 'closed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
                        )}
                    >
                        {sprint.sprint.state}
                    </span>
                </td>
                <td className="px-3 py-2 text-center" dangerouslySetInnerHTML={{ __html: sprint.lastUserToClose || '' }} />
                <td className={cellClass}>
                    <SPVal oldVal={sprint.estimateIssuesSPOld} val={sprint.estimateIssuesSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.estimateIssuesWithSP} total={sprint.estimateIssuesCount} />
                </td>
                <td className={cellClass}>
                    <SPVal oldVal={sprint.totalIssuesSPOld} val={sprint.totalIssuesSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.totalIssuesWithSP} total={sprint.totalIssuesCount} />
                </td>
                <td className={cellClass}>
                    <SPVal oldVal={sprint.completedSPOld} val={sprint.completedSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.completedWithSP} total={sprint.CompletedTotal} />
                </td>
                <td className={cellClass}>
                    <SPVal oldVal={sprint.incompletedSPOld} val={sprint.incompletedSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.incompletedWithSP} total={sprint.incompletedTotal} />
                </td>
                <td className={cellClass}>
                    <SPVal oldVal={sprint.addedSPOld} val={sprint.addedSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.addedWithSP} total={sprint.addedIssues} />
                </td>
                <td className={cellClass}>
                    <SPVal oldVal={sprint.removedSPOld} val={sprint.removedSP} />
                </td>
                <td className={cellClass}>
                    <CountVal withSP={sprint.removedWithSP} total={sprint.removedTotal} />
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={17} className="p-0">
                        <SprintTicketDetails sprint={sprint} />
                    </td>
                </tr>
            )}
        </>
    );
}

function SPVal({ oldVal, val }: { oldVal?: number; val?: number | string }) {
    return (
        <>
            {oldVal && (
                <span className="text-amber-500 mr-1 text-xs">
                    {oldVal} <i className="fa fa-arrow-right text-[10px]" />
                </span>
            )}
            <span className="font-medium">{val}</span>
        </>
    );
}

function CountVal({ withSP, total }: { withSP: number; total: number }) {
    if (!total) return null;
    return (
        <span className="text-xs">
            <span className="text-green-600">{withSP}</span>
            <span className="text-secondary mx-0.5">+</span>
            <span className="text-orange-500">{total - withSP}</span>
            <span className="text-secondary mx-0.5">=</span>
            <span className="font-semibold">{total}</span>
        </span>
    );
}

function SprintTicketDetails({ sprint }: { sprint: any }) {
    return (
        <div className="bg-(--bg-primary)/50 border-t border-b border-(--border-color)">
            <ScrollableTable className="text-xs" exportSheetName={sprint.sprint.name}>
                <THead>
                    <tr>
                        <th className="px-3 py-1.5 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[100px]">
                            Key
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[300px]">
                            Summary
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[100px]">
                            Issue Type
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[80px]">
                            Priority
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[80px]">
                            Status
                        </th>
                        <th className="px-3 py-1.5 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) min-w-[80px]">
                            Story Points
                        </th>
                    </tr>
                </THead>
                <TBody>
                    <CategorizedTicketList
                        header="Completed Issues"
                        issues={sprint.contents.completedIssues}
                        headerColor="text-green-600"
                    />
                    <CategorizedTicketList
                        header="Issues Removed From Sprint"
                        issues={sprint.contents.puntedIssues}
                        headerColor="text-orange-600"
                    />
                    <CategorizedTicketList
                        header="Issues Not Completed"
                        issues={sprint.contents.issuesNotCompletedInCurrentSprint}
                        headerColor="text-red-500"
                    />
                </TBody>
            </ScrollableTable>
        </div>
    );
}

interface CategorizedTicketListProps {
    header: string;
    issues: any[];
    headerColor: string;
}

function CategorizedTicketList({ header, issues, headerColor }: CategorizedTicketListProps) {
    if (!issues || issues.length === 0) return null;

    return (
        <>
            <tr>
                <td colSpan={6} className={`px-3 py-2 font-bold ${headerColor} bg-(--bg-secondary)/50`}>
                    {header}
                </td>
            </tr>
            {issues.map((issue, i) => (
                <tr
                    key={i}
                    className={classNames(
                        'border-b border-(--border-color)/30 hover:bg-(--bg-hover)',
                        issue.addedLater && 'bg-amber-500/5',
                    )}
                >
                    <td className="px-3 py-1.5 font-medium">
                        {issue.key}
                        {issue.addedLater && <span className="text-amber-500 ml-1 text-[10px]">*</span>}
                    </td>
                    <td className="px-3 py-1.5">{issue.summary}</td>
                    <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                            {issue.typeUrl && <img className="w-4 h-4" src={issue.typeUrl} alt="" />}
                            <span>{issue.typeName}</span>
                        </div>
                    </td>
                    <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                            {issue.priorityUrl && <img className="w-4 h-4" src={issue.priorityUrl} alt="" />}
                            <span>{issue.priorityName}</span>
                        </div>
                    </td>
                    <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                            {issue.statusUrl && <img className="w-4 h-4" src={issue.statusUrl} alt="" />}
                            <span>{issue.statusName}</span>
                        </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                        {issue.oldSP >= 0 && (
                            <span className="text-amber-500 mr-1">
                                {issue.oldSP} <i className="fa fa-arrow-right text-[10px]" />
                            </span>
                        )}
                        <span className="font-medium">{issue.currentSP}</span>
                    </td>
                </tr>
            ))}
        </>
    );
}

export default SummaryView2;
