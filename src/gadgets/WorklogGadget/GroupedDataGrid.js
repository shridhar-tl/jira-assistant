/* eslint-disable complexity */
import React, { PureComponent } from 'react';
import moment from 'moment';
import { ScrollableTable, THead, TBody } from '../../components/ScrollableTable';
import { getUserName, calcCostPerSecs } from '../../common/utils';

class GroupedDataGrid extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { groupedData: this.generateGroupData(props) };
    }

    UNSAFE_componentWillMount() {
        this.setState({ groupedData: this.generateGroupData(this.props) });
    }

    UNSAFE_componentWillReceiveProps(props) {
        this.setState({ groupedData: this.generateGroupData(props) });
    }

    getCssClass(day, time) {
        time = time > 0 ? time : 0;
        if (day.isHoliday) {
            return time ? 'log-high' : 'col-holiday';
        }
        else {
            const secsPerDay = this.props.maxSecsPerDay;
            if (time === secsPerDay) {
                return 'log-good';
            }
            else if (time < secsPerDay) {
                return 'log-less';
            }
            else if (time > secsPerDay) {
                return 'log-high';
            }
        }
    }

    generateGroupData(props) {
        const { rawData: data, dates, pageSettings, groups, getTicketUrl } = props;
        const timezoneSetting = parseInt(pageSettings.timeZone);

        const groupedData = groups.map(grp => {
            const grpInfo = {
                name: grp.name,
                total: {},
                totalCost: {},
                grandTotal: 0,
                grandTotalCost: 0,
                users: null
            };
            grpInfo.users = grp.users.map(usr => {
                let curTimeZone = null;
                if (timezoneSetting === 2) {
                    curTimeZone = grp.timeZone;
                }
                else if (timezoneSetting === 3) {
                    curTimeZone = usr.timeZone || grp.timeZone;
                }

                if (curTimeZone && typeof curTimeZone === "object") { // ToDo: Temp code to solve timezone issue. Need to remove after some time.
                    if (typeof curTimeZone.value === "string") {
                        curTimeZone = curTimeZone.value;
                    } else {
                        curTimeZone = "";
                    }
                }

                if (curTimeZone === "GRP_TZ") {
                    curTimeZone = grp.timeZone;
                }

                if (curTimeZone && typeof curTimeZone === "object") { // ToDo: Temp code to solve timezone issue. Need to remove after some time.
                    if (typeof curTimeZone.value === "string") {
                        curTimeZone = curTimeZone.value;
                    } else {
                        curTimeZone = "";
                    }
                }

                const usrInfo = {
                    name: getUserName(usr),
                    displayName: usr.displayName,
                    emailAddress: usr.emailAddress,
                    timeZone: curTimeZone,
                    imageUrl: usr.avatarUrls['48x48'] || usr.avatarUrls['32x32'],
                    profileUrl: usr.self,
                    costPerHour: usr.costPerHour,
                    tickets: null,
                    total: {},
                    totalCost: {},
                    logClass: {},
                    grandTotal: 0,
                    grandTotalCost: 0
                };

                const usrDta = data.first(d => d.userName === getUserName(usr, true)) || {};

                if (usrDta.isCurrentUser) {
                    usrInfo.isCurrentUser = true;
                }

                const logData = usrDta.logData || [];
                usrInfo.tickets = logData.groupBy(lGrp => lGrp.ticketNo)
                    .map(tGrp => {
                        const items = tGrp.values;
                        const firstTkt = items.first();
                        const logs = {};

                        const ticket = {
                            ticketNo: tGrp.key,
                            parent: firstTkt.parent,
                            parentUrl: firstTkt.parent ? getTicketUrl(firstTkt.parent) : null,
                            parentSummary: firstTkt.parentSummary,
                            projectKey: firstTkt.projectKey,
                            projectName: firstTkt.projectName,
                            assignee: firstTkt.assignee,
                            reporter: firstTkt.reporter,
                            epicDisplay: firstTkt.epicDisplay,
                            epicUrl: firstTkt.epicUrl,
                            issueType: firstTkt.issueType,
                            statusName: firstTkt.statusName,
                            summary: firstTkt.summary,
                            originalestimate: firstTkt.originalestimate,
                            remainingestimate: firstTkt.remainingestimate,
                            totalLogged: firstTkt.totalLogged,
                            estVariance: firstTkt.estVariance,
                            url: firstTkt.url,
                            logs: logs,
                            totalHours: 0,
                            totalCost: 0
                        };
                        let totalHours = 0;
                        items.forEach(item => {
                            let logTime = item.logTime;
                            if (curTimeZone) {
                                logTime = moment(moment(logTime).tz(curTimeZone).format('YYYY-MM-DD HH:mm:ss')).toDate();
                            }
                            const dateFormated = logTime.format('yyyyMMdd');
                            let logForDate = logs[dateFormated];
                            if (!logForDate) {
                                logForDate = [];
                                logs[dateFormated] = logForDate;
                            }
                            logForDate.push({
                                logTime: logTime,
                                totalHours: item.totalHours,
                                totalCost: calcCostPerSecs(item.totalHours, usr.costPerHour),
                                comment: item.comment
                            });
                            totalHours += item.totalHours;
                        });
                        ticket.totalHours = totalHours;
                        ticket.totalCost = calcCostPerSecs(totalHours, usr.costPerHour);
                        return ticket;
                    });
                // Set date wise total per user
                const logClass = usrInfo.logClass;
                const usrTotal = usrInfo.total;
                const usrTotalCost = usrInfo.totalCost;
                let usrGTotal = 0;
                dates.forEach(d => {
                    const totalHrs = usrInfo.tickets.sum(t => {
                        const lgArr = t.logs[d.prop];
                        if (lgArr) {
                            return lgArr.sum(l => l.totalHours);
                        }
                        else {
                            return 0;
                        }
                    });
                    if (totalHrs > 0) {
                        usrTotal[d.prop] = totalHrs;
                        usrTotalCost[d.prop] = calcCostPerSecs(totalHrs, usr.costPerHour);
                        usrGTotal += totalHrs;
                    }
                    logClass[d.prop] = this.getCssClass(d, totalHrs);
                });
                usrInfo.grandTotal = usrGTotal;
                usrInfo.grandTotalCost = calcCostPerSecs(usrGTotal, usr.costPerHour);
                return usrInfo;
            });
            // Set date wise total per group
            const grpTotal = grpInfo.total;
            const grpTotalCost = grpInfo.totalCost;
            let grpGTotal = 0;
            let grpGTotalCost = 0;
            dates.forEach(d => {
                const totalHrs = grpInfo.users.sum(u => u.total[d.prop] || 0);
                if (totalHrs > 0) {
                    grpTotal[d.prop] = totalHrs;
                    grpGTotal += totalHrs;
                }
                const totalCost = grpInfo.users.sum(u => u.totalCost[d.prop] || 0);
                if (totalCost > 0) {
                    grpTotalCost[d.prop] = totalCost;
                    grpGTotalCost += totalCost;
                }
            });
            grpInfo.grandTotal = grpGTotal;
            grpInfo.grandTotalCost = grpGTotalCost;
            return grpInfo;
        });

        // Set date wise total for all groups
        let grandTotal = 0;
        let grandTotalCost = 0;
        const grpTotal = {};
        const grpTotalCost = {};
        dates.forEach(d => {
            const totalHrs = groupedData.sum(u => u.total[d.prop] || 0);
            if (totalHrs > 0) {
                grpTotal[d.prop] = totalHrs;
                grandTotal += totalHrs;
            }

            const totalCost = groupedData.sum(u => u.totalCost[d.prop] || 0);
            if (totalCost > 0) {
                grpTotalCost[d.prop] = totalCost;
                grandTotalCost += totalCost;
            }
        });

        groupedData.grandTotal = grandTotal;
        groupedData.grandTotalCost = grandTotalCost;
        groupedData.total = grpTotal;
        groupedData.totalCost = grpTotalCost;

        return groupedData;
    }

    render() {
        const { state: { groupedData },
            props: { months, dates, convertSecs, formatTime, breakupMode, pageSettings, addWorklog, costView }
        } = this;

        const timeExportFormat = pageSettings?.logFormat === "2" ? "float" : undefined;

        const { showProject, showParentSummary, showIssueType, showEpic, showAssignee, showReporter } = pageSettings || {};
        const addlColCount = 1
            + (showProject ? 1 : 0)
            + (showParentSummary ? 1 : 0)
            + (showIssueType ? 1 : 0)
            + (showEpic ? 1 : 0)
            + (showAssignee ? 1 : 0)
            + (showReporter ? 1 : 0);


        return (
            <ScrollableTable exportSheetName="Grouped - [User daywise]">
                <THead>
                    <tr className="data-center pad-min auto-wrap">
                        <th style={{ minWidth: 260 + (addlColCount * 120) }} rowSpan={addlColCount > 1 ? 1 : 2} colSpan={addlColCount}>User Details</th>
                        {months.map((day, i) => <th key={i} style={{ minWidth: 35 }} colSpan={day.days}>{day.monthName}</th>)}
                        {!costView && <th style={{ minWidth: 50 }} rowSpan={2}>Total Hours</th>}
                        {costView && <th style={{ minWidth: 50 }} rowSpan={2}>Total Cost</th>}
                    </tr>
                    <tr className="pad-min auto-wrap">
                        {addlColCount > 1 && <th style={{ minWidth: 380 }} >Issue details</th>}
                        {!!showProject && <th>Project</th>}
                        {!!showParentSummary && <th>Parent Summary</th>}
                        {!!showIssueType && <th>Issuetype</th>}
                        {!!showEpic && <th>Epic</th>}
                        {!!showAssignee && <th>Assignee</th>}
                        {!!showReporter && <th>Reporter</th>}
                        {dates.map((day, i) => <th key={i} style={{ minWidth: 35 }}>{day.display}</th>)}
                    </tr>
                </THead>
                <TBody>
                    {
                        groupedData.map((grp, i) => <GroupRow key={i} colSpan={addlColCount} group={grp} dates={dates} addWorklog={addWorklog} costView={costView}
                            convertSecs={convertSecs} timeExportFormat={timeExportFormat} formatTime={formatTime} breakupMode={breakupMode} pageSettings={pageSettings} />)
                    }

                    {!costView && <tr className="grouped-row right auto-wrap">
                        <td colSpan={addlColCount}>Grand Total <i className="fa fa-arrow-right" /></td>
                        {dates.map((day, i) => <td key={i} exportType={timeExportFormat}>{convertSecs(groupedData.total[day.prop])}</td>)}
                        <td exportType={timeExportFormat}>{convertSecs(groupedData.grandTotal)}</td>
                    </tr>}

                    {costView && <tr className="grouped-row right auto-wrap">
                        <td colSpan={addlColCount}>Grand Total <i className="fa fa-arrow-right" /></td>
                        {dates.map((day, i) => <td key={i}>{groupedData.totalCost[day.prop]}</td>)}
                        <td>{groupedData.grandTotalCost}</td>
                    </tr>}
                </TBody>
            </ScrollableTable>
        );
    }
}

export default GroupedDataGrid;

class GroupRow extends PureComponent {
    state = {};

    toggleDisplay = () => this.setState({ hidden: !this.state.hidden });

    render() {
        const {
            props: {
                group: grp, dates, convertSecs, formatTime, breakupMode,
                pageSettings, addWorklog, timeExportFormat, costView, colSpan
            }, state: { hidden }
        } = this;

        return (
            <>
                {!hidden && <tr className="grouped-row left" title="Click to hide user details">
                    <td colSpan={dates.length + 2} onClick={this.toggleDisplay}>
                        <i className="pull-left drill-down fa fa-chevron-circle-down" />
                        {grp.name}
                    </td>
                </tr>}

                {!hidden && grp.users.map((u, i) => <UserRow key={i} colSpan={colSpan} user={u} dates={dates} breakupMode={breakupMode} costView={costView} addWorklog={addWorklog} timeExportFormat={timeExportFormat}
                    convertSecs={convertSecs} formatTime={formatTime} pageSettings={pageSettings} />)}

                <tr className="grouped-row right auto-wrap" onClick={hidden ? this.toggleDisplay : null}>
                    <td colSpan={colSpan}>
                        {hidden && <div>
                            <i className="pull-left drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                            <span className="pull-left">{grp.name}</span><span className="pull-right">Total <i className="fa fa-arrow-right" /></span>
                        </div>}
                        {!hidden && <div>{grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" /></div>}
                    </td>

                    {!costView && dates.map((day, i) => <td key={i} exportType={timeExportFormat}>{convertSecs(grp.total[day.prop])}</td>)}
                    {!costView && <td exportType={timeExportFormat}>{convertSecs(grp.grandTotal)}</td>}

                    {costView && dates.map((day, i) => <td key={i}>{grp.totalCost[day.prop]}</td>)}
                    {costView && <td>{grp.grandTotalCost}</td>}
                </tr>
            </>
        );
    }
}

class UserRow extends PureComponent {
    state = {};

    getComments = (arr, showCost) => {
        if (!arr || arr.length === 0) {
            return "";
        }

        return arr.map((a) => {
            return `${this.props.formatTime(a.logTime)}(${this.props.convertSecs(a.totalHours)})${(showCost ? (`, Cost: ${a.totalCost}`) : '')} - ${a.comment}`;
        }).join(';\n');
    };

    getTotalTime(arr) {
        if (!arr || arr.length === 0) {
            return "";
        }
        return arr.sum((a) => { return a.totalHours; });
    }

    getTotalCost(arr) {
        if (!arr || arr.length === 0) {
            return "";
        }
        return arr.sum((a) => { return a.totalCost; });
    }

    toggleDisplay = () => this.setState({ expanded: !this.state.expanded });

    getLogEntries(entries) {
        if (Array.isArray(entries) && entries.length > 0) {
            const seperator = entries.length > 1 ? ";" : "";
            return entries.map((d, i) => <span key={i} title={`${this.props.formatTime(d.logTime)} - ${d.comment}`}>{this.props.convertSecs(d.totalHours) + seperator}</span>);
        }
    }

    addWorklog = (ticketNo, day) => {
        const { user, addWorklog } = this.props;
        const { date, prop } = day;
        addWorklog(user, ticketNo, date, user.total[prop]);
    };

    render() {
        const {
            props: { user: u, dates, convertSecs, breakupMode,
                pageSettings: { hideEstimate, showProject, showParentSummary, showIssueType, showEpic, showAssignee, showReporter },
                timeExportFormat, costView, colSpan },
            state: { expanded }
        } = this;

        return (
            <>
                <tr className="pointer auto-wrap" onClick={this.toggleDisplay}>
                    <td className="data-left" colSpan={colSpan}>
                        <div className="user-info" style={{ paddingLeft: 0 }}>
                            <i className={`pull-left drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`}
                                title="Click to toggle ticket details" />
                            <img src={u.imageUrl} height={40} width={40} className="pull-left" alt={u.displayName} />
                            <span className="name">{u.displayName}</span>
                            <span className="email">({u.emailAddress || u.name}{u.timeZone && <span>, time zone: {u.timeZone}</span>})</span>
                        </div>
                    </td>

                    {!costView && dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`} exportType={timeExportFormat}>
                        {u.isCurrentUser && <span className="fa fa-clock-o add-wl" title="Click to add worklog" onClick={() => this.addWorklog(null, day)} />}
                        {convertSecs(u.total[day.prop])}</td>)}
                    {!costView && <td exportType={timeExportFormat}>{convertSecs(u.grandTotal)}</td>}

                    {costView && dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`}>{u.totalCost[day.prop]}</td>)}
                    {costView && <td>{u.grandTotalCost}</td>}
                </tr>

                {expanded &&
                    u.tickets.map((t, i) => {
                        const oe = convertSecs(t.originalestimate);
                        const re = convertSecs(t.remainingestimate);
                        const logged = convertSecs(t.totalLogged) || 0;
                        const variance = (t.estVariance > 0 ? "+" : "") + (convertSecs(t.estVariance) || (t.originalestimate > 0 ? 0 : "NA"));
                        const estTitle = `Original Estimate: ${oe || 0}\nRemaining: ${re || 0}\nTotal Logged: ${logged}\nEstimate Variance: ${variance}`;

                        return (
                            <tr key={i} className="auto-wrap">
                                <td className="data-left">
                                    {!showParentSummary && t.parent && <a href={t.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{t.parent} - </a>}
                                    <a href={t.url} className="link" target="_blank" rel="noopener noreferrer">{t.ticketNo}</a> -
                                    <span>{t.summary}</span>
                                    <strong> ({t.statusName})</strong>
                                    {!hideEstimate && !!(oe || re) && <span className="estimate" title={estTitle}>
                                        (est: {oe || 0} / rem: {re || 0} / log: {logged} / var: {variance})</span>}
                                </td>

                                {!!showProject && <td>{t.projectKey} - {t.projectName}</td>}
                                {!!showParentSummary && <td>{t.parent && <a href={t.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{t.parent}</a>} - {t.parentSummary}</td>}
                                {!!showIssueType && <td>{t.issueType}</td>}
                                {!!showEpic && <td>{t.epicDisplay && <a href={t.epicUrl} className="link" target="_blank" rel="noopener noreferrer">{t.epicDisplay}</a>}</td>}
                                {!!showAssignee && <td>{t.assignee}</td>}
                                {!!showReporter && <td>{t.reporter}</td>}

                                {!costView && dates.map((day, j) => <td key={j} className="day-wl-block" exportType={timeExportFormat}>
                                    {u.isCurrentUser && <span className="fa fa-clock-o add-wl" title="Click to add worklog" onClick={() => this.addWorklog(t.ticketNo, day)} />}
                                    {breakupMode !== '2' && <span title={this.getComments(t.logs[day.prop])}>{convertSecs(this.getTotalTime(t.logs[day.prop]))}</span>}
                                    {breakupMode === '2' && <div> {this.getLogEntries(t.logs[day.prop])}</div>}
                                </td>)}
                                {!costView && <td exportType={timeExportFormat}>{convertSecs(t.totalHours)}</td>}

                                {costView && dates.map((day, j) => <td key={j} className="day-wl-block">
                                    <span title={this.getComments(t.logs[day.prop], costView)}>{this.getTotalCost(t.logs[day.prop])}</span>
                                </td>)}
                                {costView && <td>{t.totalCost}</td>}
                            </tr>
                        );
                    })
                }
            </>
        );
    }
}