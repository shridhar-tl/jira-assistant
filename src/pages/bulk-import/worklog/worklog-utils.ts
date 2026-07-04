export const wlStatusWillImport = 'Will Import';
export const wlStatusInvalid = 'Invalid';
export const wlStatusError = 'Error';
export const wlStatusExcluded = 'Excluded';

const fieldTicketNo = 'ticketNo';
const fieldStartDate = 'startDate';
const fieldTimeSpent = 'timespent';
const fieldComment = 'comment';

export const fieldMapping: Record<string, string> = {
    ticketno: fieldTicketNo,
    ticket: fieldTicketNo,
    issuekey: fieldTicketNo,
    issue: fieldTicketNo,
    key: fieldTicketNo,
    id: fieldTicketNo,
    startdate: fieldStartDate,
    started: fieldStartDate,
    logdate: fieldStartDate,
    loggeddate: fieldStartDate,
    worklogdate: fieldStartDate,
    date: fieldStartDate,
    timespent: fieldTimeSpent,
    timespentseconds: fieldTimeSpent,
    seconds: fieldTimeSpent,
    hoursspent: fieldTimeSpent,
    time: fieldTimeSpent,
    spent: fieldTimeSpent,
    comment: fieldComment,
    comments: fieldComment,
    description: fieldComment,
    details: fieldComment,
};
