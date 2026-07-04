import React from 'react';

import { IssueDays, IssueInfo } from '../userdaywise/shared';

interface TicketRowProps {
    isSprint: boolean;
    issue: any;
    dates?: any[];
    user: any;
    uid: string;
    sprintsList?: any[];
    costView?: boolean;
    timeExportFormat?: string;
    fields: any;
    convertSecs: (val: number) => any;
    formatTime: (val: Date) => string;
    addNewWorklog?: (ticketNo: string, day: any) => void;
    additionalCols?: any[];
}

export default function TicketRow({
    isSprint,
    issue,
    dates,
    user,
    uid,
    sprintsList,
    costView,
    timeExportFormat,
    fields,
    convertSecs,
    formatTime,
    addNewWorklog,
    additionalCols,
}: TicketRowProps) {
    const hideEstimate = fields?.hideEstimate;

    return (
        <tr className="auto-wrap" data-row-id="ticket" data-current-user={user?.isCurrentUser ? '1' : '0'} data-test-id={issue.ticketNo}>
            <IssueInfo issue={issue} showParentSummary={false} hideEstimate={hideEstimate} convertSecs={convertSecs} />

            {additionalCols?.map(({ key, Component, props }: any) =>
                Component ? <Component key={key} value={issue.fields?.[key]} {...props} /> : <td key={key}>{issue.fields?.[key]}</td>,
            )}

            {isSprint &&
                sprintsList?.map(({ id }: any) => (
                    <IssueDays
                        key={id}
                        convertSecs={convertSecs}
                        costView={costView}
                        dates={dates || []}
                        formatTime={formatTime}
                        ticket={issue}
                        user={user}
                        addNewWorklog={addNewWorklog}
                    />
                ))}
            {!isSprint && (
                <IssueDays
                    convertSecs={convertSecs}
                    timeExportFormat={timeExportFormat}
                    dates={dates || []}
                    formatTime={formatTime}
                    ticket={issue}
                    user={user}
                    costView={costView}
                    addNewWorklog={addNewWorklog}
                />
            )}

            {isSprint && costView && <td>{issue.allSprintTotalCost}</td>}
            {isSprint && !costView && <td>{convertSecs(issue.allSprintTotalHours)}</td>}
        </tr>
    );
}
