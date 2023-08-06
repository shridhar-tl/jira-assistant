import React, { useEffect, useState } from "react";
import { Column, NoDataRow, ScrollableTable, TBody, THead } from "../ScrollableTable";
import Link from "../../controls/Link";
import { getQuickDateValue } from "../../controls/DatePicker";
import { useService } from "../../services/injector-service";
import Loader from "./Loader";
import Indicator from "../worklog-indicator";

const Control = function ({ lastUpdated, showContext, editWorklog, settings, setLoader }) {
    const [worklogs, setData] = useState(false);
    const { $worklog, $utils, $userutils, $session: { CurrentUser: { maxHours: max } } } = useService('WorklogService', 'UtilsService', 'UserUtilsService', 'SessionService');
    const maxHours = (max || 8) * 60 * 60;

    useEffect(() => {
        (async () => {
            try {
                const selDate = settings.dateRange;
                if (!selDate) {
                    setData([]);
                    return;
                }

                const [fromDate, toDate] = getQuickDateValue(selDate.quickDate) || [];
                if (fromDate) {
                    selDate.fromDate = fromDate;
                    selDate.toDate = toDate;
                }

                if (!selDate.fromDate) {
                    setData([]);
                    return;
                }

                setLoader?.(true);
                selDate.dateWise = true;
                const result = await $worklog.getWorklogs(selDate);
                result.forEach((b) => b.rowClass = $utils.getRowStatus(b));
                setData(result);
            } finally {
                setLoader?.(false);
            }
        })();
    }, [lastUpdated]);// eslint-disable-line react-hooks/exhaustive-deps

    if (worklogs === false) {
        return (<Loader />);
    }

    const getWorklogUrl = (ticketNo, worklogId) => $userutils.getWorklogUrl(ticketNo, worklogId);

    return (<ScrollableTable dataset={worklogs} exportSheetName="Datewise worklog">
        <THead>
            <tr>
                <Column sortBy="dateLogged" style={{ width: '100px' }}>Logged Date</Column>
                <Column sortBy="totalHours">Total Hours</Column>
                <Column sortBy="uploaded">Uploaded</Column>
                <Column sortBy="pendingUpload">Pending Upload</Column>
                <Column>Ticket List</Column>
            </tr>
        </THead>
        <TBody className="no-log-bg-hl">
            {(b) => <tr key={b.dateLogged} onContextMenu={showContext ? (e) => showContext(e, b) : undefined} className={b.rowClass}>
                <td>{$userutils.formatDate(b.dateLogged)}</td>
                <td className="log-indi-cntr">
                    {$utils.formatTs(b.totalHours)}
                    {b.totalSecs > 0 && <Indicator value={b.totalSecs} maxHours={maxHours} />}
                </td>
                <td>{$utils.formatTs(b.uploaded)}</td>
                <td>{$utils.formatTs(b.pendingUpload)}</td>
                <td>
                    <ul className="tags">
                        {b.ticketList.map((ld, x) => <li key={x}>
                            {ld.worklogId && <Link className="link badge badge-pill skin-bg-font" href={getWorklogUrl(ld.ticketNo, ld.worklogId)}
                                title={ld.comment}>
                                <span className="fa fa-clock" /> {ld.ticketNo}: {ld.uploaded}
                            </Link>}
                            {!ld.worklogId && <span className="link badge badge-pill skin-bg-font"
                                onClick={editWorklog ? () => editWorklog(ld.id) : undefined} title={ld.comment}>
                                <span className="fa fa-clock" /> {ld.ticketNo}: {ld.uploaded}
                            </span>}
                        </li>)}
                    </ul>
                </td>
            </tr>}
        </TBody>
        <NoDataRow span={5}>No worklog exists for selected date range!</NoDataRow>
    </ScrollableTable>);
};

export default Control;