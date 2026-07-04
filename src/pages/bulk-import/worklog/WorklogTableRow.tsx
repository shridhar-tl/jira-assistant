import { Checkbox } from '@components';
import { Link } from '@controls';

interface TicketSummary {
    summary: string;
    assignee?: string;
    issueTypeIcon?: string;
    issueType?: string;
}

interface WorklogRow {
    selected: boolean;
    disabled: boolean;
    status: string;
    error: string;
    ticketNo: string;
    startDate: Date | string;
    timespent: number | string;
    comment: string;
    id?: number;
    worklogId?: string;
}

interface WorklogTableRowProps {
    row: WorklogRow;
    index: number;
    ticket: TicketSummary;
    hasTicketInfo: boolean;
    ticketUrl: string;
    worklogUrl: string;
    formattedDate: string;
    formattedTimespent: string;
    onToggle: () => void;
}

function WorklogTableRow({
    row,
    index,
    ticket,
    hasTicketInfo,
    ticketUrl,
    worklogUrl,
    formattedDate,
    formattedTimespent,
    onToggle,
}: WorklogTableRowProps) {
    return (
        <tr key={index} className={row.error ? 'row-error' : ''}>
            <td>
                <Checkbox checked={row.selected} disabled={row.disabled} onChange={onToggle} />
            </td>
            {hasTicketInfo && (
                <td>
                    <Link href={ticketUrl}>{row.ticketNo}</Link>
                </td>
            )}
            {!hasTicketInfo && <td>{row.ticketNo}</td>}
            <td>
                {ticket.issueTypeIcon && <img src={ticket.issueTypeIcon} alt="" className="inline mr-1 w-4 h-4" />}
                {ticket.issueType}
            </td>
            <td>{ticket.summary}</td>
            <td>{formattedDate}</td>
            <td>{formattedTimespent}</td>
            <td>{row.comment}</td>
            <td>{ticket.assignee}</td>
            {row.worklogId && (
                <td title="Worklog uploaded successfully">
                    <Link href={worklogUrl}>{row.status}</Link>
                </td>
            )}
            {!row.worklogId && (
                <td title={row.error}>
                    {row.error && <i className="fa fa-exclamation-triangle text-red-600 mr-1" />}
                    {row.status}
                </td>
            )}
        </tr>
    );
}

export type { WorklogRow, TicketSummary };
export default WorklogTableRow;
