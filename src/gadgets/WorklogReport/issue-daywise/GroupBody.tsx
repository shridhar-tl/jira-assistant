import React from 'react';

import { TBody } from '../../../components/shared';
import { useWorklogStore } from '../datastore';
import { useConvertSecs, useFormatTime } from '../userdaywise/useReportUtils';

import TicketRow from './TicketRow';

interface GroupBodyProps {
    boardId?: string;
    additionalCols?: any[];
    costView?: boolean;
}

export default function GroupBody({ boardId, additionalCols, costView }: GroupBodyProps) {
    const state = useWorklogStore();
    const { timeframeType, logFormat, rIndicator, fields } = state;

    const isSprint = timeframeType === '1';
    const issuesList = isSprint ? state[`userGroup_${boardId}`] : state.issueDayWise?.issuesList;
    const dates = isSprint ? undefined : state.issueDayWise?.dates;
    const sprintsList = isSprint ? state[`sprintsList_${boardId}`] : undefined;

    const timeExportFormat = logFormat === '2' ? 'float' : undefined;

    const convertSecs = useConvertSecs();
    const formatTime = useFormatTime();

    if (!issuesList) {
        return null;
    }

    return (
        <TBody className={rIndicator !== '2' ? 'no-log-bg-hl' : ''}>
            {issuesList.map((t: any, i: number) => (
                <TicketRow
                    key={i}
                    isSprint={isSprint}
                    issue={t}
                    dates={dates}
                    user={t.fields?.worklogUser}
                    uid={t.fields?.worklogUser}
                    sprintsList={sprintsList}
                    timeExportFormat={timeExportFormat}
                    fields={fields}
                    convertSecs={convertSecs}
                    formatTime={formatTime}
                    costView={costView}
                    additionalCols={additionalCols}
                />
            ))}
        </TBody>
    );
}
