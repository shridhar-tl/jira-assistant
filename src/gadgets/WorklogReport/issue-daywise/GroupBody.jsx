import React from 'react';
import { TBody } from '../../../components/ScrollableTable';
import { connect } from '../datastore';
import { convertSecs } from '../actions';
import TicketRow from './TicketRow';

function ReportBody({ isSprint,
    issuesList, dates, additionalCols, sprintsList, fields,
    logFormat, costView, rIndicator, convertSecs, formatTime
}) {
    const timeExportFormat = logFormat === "2" ? "float" : undefined;
    const groupRows = issuesList.map((t, i) => <TicketRow key={i} isSprint={isSprint} issue={t} dates={dates} user={t.fields.worklogUser} uid={t.fields.worklogUser}
        sprintsList={sprintsList} timeExportFormat={timeExportFormat} fields={fields} convertSecs={convertSecs} formatTime={formatTime}
        costView={costView} additionalCols={additionalCols} />);

    return (<TBody className={rIndicator !== '2' ? 'no-log-bg-hl' : ''}>
        {groupRows}
    </TBody>);
}

export default connect(ReportBody,
    (state, { boardId }) => {
        const isSprint = state.timeframeType === '1';
        if (isSprint) {
            const {
                [`userGroup_${boardId}`]: issuesList,
                [`sprintsList_${boardId}`]: sprintsList,
                logFormat, rIndicator, fields
            } = state;

            return ({ isSprint, sprintsList, issuesList, logFormat, rIndicator, fields });
        } else {
            const { issueDayWise: { issuesList, dates }, logFormat, rIndicator, fields } = state;

            return ({ issuesList, dates, logFormat, rIndicator, fields });
        }
    }, { convertSecs }, [
    'UserUtilsService',
    ({ $userutils: { formatTime } }) => ({ formatTime })
]);