import { Image, Link } from '../../../controls';
import { useWorklogStore } from '../datastore';
import TicketEstimate from '../TicketEstimate';

interface WeeksListProps {
    sprint?: any;
}

export function WeeksList({ sprint }: WeeksListProps) {
    const state = useWorklogStore();
    const groupReportKey = sprint ? `groupReport_${sprint.id}` : 'groupReport';
    const weeks = state[groupReportKey]?.weeks || [];

    return (
        <>
            {weeks.map((day: any, i: number) => (
                <th key={i} className="week-head" colSpan={day.days}>
                    {day.display}
                </th>
            ))}
        </>
    );
}

interface DatesListProps {
    sprintId?: number;
}

export function DatesList({ sprintId }: DatesListProps) {
    const state = useWorklogStore();
    const groupReportKey = sprintId ? `groupReport_${sprintId}` : 'groupReport';
    const dates = state[groupReportKey]?.dates || [];

    return (
        <>
            {dates.map((day: any, i: number) => (
                <th key={i} data-test-id={day.prop} className={`day-head${day.isHoliday ? ' holiday' : ''}`}>
                    {day.dateNum} <span className="day-name">{day.day}</span>
                </th>
            ))}
        </>
    );
}

interface IssueDaysProps {
    costView?: boolean;
    dates: any[];
    timeExportFormat?: string;
    breakupMode?: string;
    ticket: any;
    user: any;
    disableAddingWL?: boolean;
    addNewWorklog?: (ticketNo: string, day: any) => void;
    convertSecs: (val: number) => any;
    formatTime: (val: Date) => string;
}

export function IssueDays({
    costView,
    dates,
    timeExportFormat,
    breakupMode,
    ticket: t,
    user: u,
    disableAddingWL,
    addNewWorklog,
    convertSecs,
    formatTime,
}: IssueDaysProps) {
    const getComments = (arr: any[], showCost?: boolean) => {
        if (!arr || arr.length === 0) {
            return '';
        }

        return arr
            .map(
                (a) =>
                    `${formatTime(a.logTime)} (${convertSecs(a.totalHours)})${showCost ? `, Cost: ${a.totalCost}` : ''} - ${a.comment || '(no comment provided)'}`,
            )
            .join(';\n');
    };

    const getTotalCost = (arr: any[]) => {
        if (!arr || arr.length === 0) return '';
        return arr.reduce((sum, a) => sum + (a.totalCost || 0), 0);
    };

    const getTotalTime = (arr: any[]) => {
        if (!arr || arr.length === 0) return '';
        return arr.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    };

    if (costView) {
        return (
            <>
                {dates.map((day, j) => (
                    <td key={j} className="day-wl-block" data-test-id={day.prop} data-export-type="float">
                        <span title={getComments(t.logs[day.prop], costView)}>{getTotalCost(t.logs[day.prop])}</span>
                    </td>
                ))}
                <td data-test-id="total" data-export-type="float">
                    {t.totalCost}
                </td>
            </>
        );
    } else {
        return (
            <>
                {dates.map((day, j) => {
                    const logTime = t.logs[day.prop];
                    const getLogEntries = (entries: any[]) => {
                        if (Array.isArray(entries) && entries.length > 0) {
                            const seperator = entries.length > 1 ? ';' : '';
                            return entries.map((d, i) => (
                                <span key={i} title={`${formatTime(d.logTime)} - ${d.comment}`}>
                                    {convertSecs(d.totalHours) + seperator}
                                </span>
                            ));
                        }
                    };

                    return (
                        <td
                            key={j}
                            className={`day-wl-block${day.isHoliday ? (!logTime?.length ? ' col-holiday' : ' log-high') : ''}`}
                            data-export-type={timeExportFormat}
                            data-test-id={day.prop}
                        >
                            {u?.isCurrentUser && disableAddingWL !== true && (
                                <span
                                    className="fa fa-clock add-wl"
                                    title="Click to add worklog"
                                    onClick={() => addNewWorklog?.(t.ticketNo, day)}
                                />
                            )}
                            {breakupMode !== '2' && <span title={getComments(logTime)}>{convertSecs(getTotalTime(logTime))}</span>}
                            {breakupMode === '2' && <div> {getLogEntries(logTime)}</div>}
                        </td>
                    );
                })}
                <td data-export-type={timeExportFormat} data-test-id="total">
                    {convertSecs(t.totalHours)}
                </td>
            </>
        );
    }
}

interface IssueInfoProps {
    issue: any;
    showParentSummary?: boolean;
    hideEstimate?: boolean;
    convertSecs: (val: number) => any;
}

export function IssueInfo({ issue: t, showParentSummary, hideEstimate, convertSecs }: IssueInfoProps) {
    const oe = convertSecs(t.originalestimate);
    const re = convertSecs(t.remainingestimate);
    const logged = convertSecs(t.totalLogged) || 0;
    const variance = (t.estVariance > 0 ? '+' : '') + (convertSecs(t.estVariance) || (t.originalestimate > 0 ? 0 : 'NA'));
    // const estTitle = `Original Estimate: ${oe || 0}
    // Remaining: ${re || 0}
    // Total Logged: ${logged}
    // Estimate Variance: ${variance}`;

    return (
        <td className="data-left">
            <div className="wl-ticket-detail" title={t.summary}>
                <Image src={t.iconUrl} title={t.issueType} />
                {!showParentSummary && t.parent && (
                    <Link href={t.parentUrl} className="link">
                        {t.parent} -{' '}
                    </Link>
                )}
                <Link href={t.url} className="link">
                    {t.ticketNo}
                </Link>{' '}
                -<span>{t.summary}</span>
            </div>
            {!hideEstimate && !!(oe || re) && <TicketEstimate est={oe} rem={re} logged={logged} variance={variance} />}
        </td>
    );
}
