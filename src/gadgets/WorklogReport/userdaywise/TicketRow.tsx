import React from 'react';

import { useWorklogStore } from '../datastore';

import { IssueDays, IssueInfo } from './shared';

interface TicketRowProps {
    isSprint: boolean;
    groupIndex: number;
    issue: any;
    user: any;
    uid: string;
    sprintsList?: any[];
    costView?: boolean;
    timeExportFormat?: string;
    convertSecs: (val: number) => any;
    formatTime: (val: Date) => string;
    addNewWorklog: (ticketNo: string, day: any) => void;
    additionalCols?: any[];
}

export default function TicketRow({
    isSprint,
    groupIndex,
    issue: t,
    user: u,
    uid,
    sprintsList,
    costView,
    timeExportFormat,
    convertSecs,
    formatTime,
    addNewWorklog,
    additionalCols,
}: TicketRowProps) {
    const { fields } = useWorklogStore();
    const hideEstimate = fields?.hideEstimate;

    return (
        <tr className="auto-wrap" data-row-id="ticket" data-current-user={u.isCurrentUser ? '1' : '0'} data-test-id={t.ticketNo}>
            <IssueInfo issue={t} showParentSummary={false} hideEstimate={hideEstimate} convertSecs={convertSecs} />

            {additionalCols?.map(({ key, Component, props }: any) =>
                Component ? <Component key={key} value={t.fields?.[key]} {...props} /> : <td key={key}>{t.fields?.[key]}</td>,
            )}

            {isSprint &&
                sprintsList?.map(({ id }: any) => (
                    <IssueDaysWrapper
                        key={id}
                        sprintId={id}
                        groupIndex={groupIndex}
                        uid={uid}
                        ticketNo={t.ticketNo}
                        isSprint={isSprint}
                        costView={costView}
                        timeExportFormat={timeExportFormat}
                        addNewWorklog={addNewWorklog}
                        convertSecs={convertSecs}
                        formatTime={formatTime}
                    />
                ))}
            {!isSprint && (
                <IssueDaysWrapper
                    groupIndex={groupIndex}
                    uid={uid}
                    ticketNo={t.ticketNo}
                    isSprint={isSprint}
                    costView={costView}
                    timeExportFormat={timeExportFormat}
                    addNewWorklog={addNewWorklog}
                    convertSecs={convertSecs}
                    formatTime={formatTime}
                />
            )}

            {isSprint && costView && <td>{t.allSprintTotalCost}</td>}
            {isSprint && !costView && <td>{convertSecs(t.allSprintTotalHours)}</td>}
        </tr>
    );
}

interface IssueDaysWrapperProps {
    sprintId?: number;
    groupIndex: number;
    uid: string;
    ticketNo: string;
    isSprint: boolean;
    costView?: boolean;
    timeExportFormat?: string;
    addNewWorklog: (ticketNo: string, day: any) => void;
    convertSecs: (val: number) => any;
    formatTime: (val: Date) => string;
}

function IssueDaysWrapper({
    sprintId,
    groupIndex,
    uid,
    ticketNo,
    isSprint,
    costView,
    timeExportFormat,
    addNewWorklog,
    convertSecs,
    formatTime,
}: IssueDaysWrapperProps) {
    const state = useWorklogStore();
    const { timeframeType, breakupMode, disableAddingWL } = state;

    const groupReportKey = timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport';
    const groupReport = state[groupReportKey];
    const { dates, groupedData } = groupReport || { dates: [], groupedData: [] };
    const group = groupedData[groupIndex];
    const user = group?.usersMap?.[uid];
    const ticket = user?.ticketsMap?.[ticketNo] || { logs: {} };

    return (
        <IssueDays
            costView={costView}
            dates={dates}
            timeExportFormat={timeExportFormat}
            breakupMode={breakupMode}
            ticket={ticket}
            user={user}
            disableAddingWL={disableAddingWL}
            addNewWorklog={addNewWorklog}
            convertSecs={convertSecs}
            formatTime={formatTime}
        />
    );
}
