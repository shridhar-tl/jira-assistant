import React, { PureComponent } from 'react';
import moment from 'moment';
import { ScrollableTable, THead, TBody } from '../../components/ScrollableTable';

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
                grandTotal: 0,
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
                if (curTimeZone === "GRP_TZ") {
                    curTimeZone = grp.timeZone;
                }
                const usrInfo = {
                    name: usr.name,
                    displayName: usr.displayName,
                    emailAddress: usr.emailAddress,
                    timeZone: curTimeZone,
                    imageUrl: usr.avatarUrls['48x48'] || usr.avatarUrls['32x32'],
                    profileUrl: usr.self,
                    tickets: null,
                    total: {},
                    logClass: {},
                    grandTotal: 0
                };
                const logData = data.first(d => d.userName === usr.name.toLowerCase()).logData;
                usrInfo.tickets = logData.groupBy(lGrp => lGrp.ticketNo)
                    .map(tGrp => {
                        const items = tGrp.values;
                        const firstTkt = items.first();
                        const logs = {};
                        const ticket = {
                            ticketNo: tGrp.key,
                            parent: firstTkt.parent,
                            parentUrl: firstTkt.parent ? getTicketUrl(firstTkt.parent) : null,
                            epicDisplay: firstTkt.epicDisplay,
                            epicUrl: firstTkt.epicUrl,
                            issueType: firstTkt.issueType,
                            summary: firstTkt.summary,
                            url: firstTkt.url,
                            logs: logs,
                            totalHours: 0
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
                            logForDate.push({ logTime: logTime, totalHours: item.totalHours, comment: item.comment });
                            totalHours += item.totalHours;
                        });
                        ticket.totalHours = totalHours;
                        return ticket;
                    });
                // Set date wise total per user
                const logClass = usrInfo.logClass;
                const usrTotal = usrInfo.total;
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
                        usrGTotal += totalHrs;
                    }
                    logClass[d.prop] = this.getCssClass(d, totalHrs);
                });
                usrInfo.grandTotal = usrGTotal;
                return usrInfo;
            });
            // Set date wise total per group
            const grpTotal = grpInfo.total;
            let grpGTotal = 0;
            dates.forEach(d => {
                const totalHrs = grpInfo.users.sum(u => u.total[d.prop] || 0);
                if (totalHrs > 0) {
                    grpTotal[d.prop] = totalHrs;
                    grpGTotal += totalHrs;
                }
            });
            grpInfo.grandTotal = grpGTotal;
            return grpInfo;
        });

        // Set date wise total for all groups
        let grandTotal = 0;
        const grpTotal = {};
        dates.forEach(d => {
            const totalHrs = groupedData.sum(u => u.total[d.prop] || 0);
            if (totalHrs > 0) {
                grpTotal[d.prop] = totalHrs;
                grandTotal += totalHrs;
            }
        });

        groupedData.grandTotal = grandTotal;
        groupedData.total = grpTotal;

        return groupedData;
    }

    render() {
        const { state: { groupedData },
            props: { months, dates, convertSecs, formatTime, breakupMode }
        } = this;

        return (
            <ScrollableTable exportSheetName="Grouped - [User daywise]">
                <THead>
                    <tr className="data-center pad-min auto-wrap">
                        <th style={{ minWidth: 380 }} rowSpan={2}>User Details</th>
                        {months.map((day, i) => <th key={i} style={{ minWidth: 35 }} colSpan={day.days}>{day.monthName}</th>)}
                        <th style={{ minWidth: 50 }} rowSpan={2}>Total Hours</th>
                    </tr>
                    <tr className="pad-min auto-wrap">
                        {dates.map((day, i) => <th key={i} style={{ minWidth: 35 }}>{day.display}</th>)}
                    </tr>
                </THead>
                <TBody>
                    {
                        groupedData.map((grp, i) => <GroupRow key={i} group={grp} dates={dates}
                            convertSecs={convertSecs} formatTime={formatTime} breakupMode={breakupMode} />)
                    }

                    <tr className="grouped-row right auto-wrap">
                        <td>Grand Total <i className="fa fa-arrow-right" /></td>
                        {dates.map((day, i) => <td key={i}>{convertSecs(groupedData.total[day.prop])}</td>)}
                        <td>{convertSecs(groupedData.grandTotal)}</td>
                    </tr>
                </TBody>
            </ScrollableTable>
        );
    }
}

export default GroupedDataGrid;

class GroupRow extends PureComponent {
    state = {};

    toggleDisplay = () => this.setState({ hidden: !this.state.hidden })

    render() {
        const {
            props: { group: grp, dates, convertSecs, formatTime, breakupMode },
            state: { hidden }
        } = this;

        return (
            <>
                {!hidden && <tr className="grouped-row left" title="Click to hide user details">
                    <td colSpan={dates.length + 2} onClick={this.toggleDisplay}>
                        <i className="pull-left drill-down fa fa-chevron-circle-down" />
                        {grp.name}
                    </td>
                </tr>}

                {!hidden && grp.users.map((u, i) => <UserRow key={i} user={u} dates={dates} breakupMode={breakupMode}
                    convertSecs={convertSecs} formatTime={formatTime} />)}

                <tr className="grouped-row right auto-wrap" onClick={hidden ? this.toggleDisplay : null}>
                    <td>
                        {hidden && <div>
                            <i className="pull-left drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                            <span className="pull-left">{grp.name}</span><span className="pull-right">Total <i className="fa fa-arrow-right" /></span>
                        </div>}
                        {!hidden && <div>{grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" /></div>}
                    </td>
                    {dates.map((day, i) => <td key={i}>{convertSecs(grp.total[day.prop])}</td>)}
                    <td>{convertSecs(grp.grandTotal)}</td>
                </tr>
            </>
        );
    }
}

class UserRow extends PureComponent {
    state = {};

    getComments = (arr) => {
        if (!arr || arr.length === 0) {
            return "";
        }

        return arr.map((a) => {
            return `${this.props.formatTime(a.logTime)}(${this.props.convertSecs(a.totalHours)}) - ${a.comment}`;
        }).join(';\n');
    }

    getTotalTime(arr) {
        if (!arr || arr.length === 0) {
            return "";
        }
        return arr.sum((a) => { return a.totalHours; });
    }

    toggleDisplay = () => this.setState({ expanded: !this.state.expanded })

    getLogEntries(entries) {
        if (Array.isArray(entries) && entries.length > 0) {
            return entries.map((d, i) => <span key={i} title={`${this.props.formatTime(d.logTime)} - ${d.comment}`}> {this.props.convertSecs(d.totalHours)}; </span>);
        }
    }

    render() {
        const {
            props: { user: u, dates, convertSecs, breakupMode },
            state: { expanded }
        } = this;

        return (
            <>
                <tr className="pointer auto-wrap" onClick={this.toggleDisplay}>
                    <td className="data-left">
                        <div className="user-info" style={{ paddingLeft: 0 }}>
                            <i className={`pull-left drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`}
                                title="Click to toggle ticket details" />
                            <img src={u.imageUrl} height={40} width={40} className="pull-left" alt={u.displayName} />
                            <span className="name">{u.displayName}</span>
                            <span className="email">({u.emailAddress}{u.timeZone && <span>, time zone: {u.timeZone}</span>})</span>
                        </div>
                    </td>
                    {dates.map((day, i) => <td key={i} className={u.logClass[day.prop]}>{convertSecs(u.total[day.prop])}</td>)}
                    <td>{convertSecs(u.grandTotal)}</td>
                </tr>

                {expanded &&
                    u.tickets.map((t, i) => (
                        <tr key={i} className="auto-wrap">
                            <td className="data-left">
                                {t.parent && <a href={t.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{t.parent} - </a>}
                                <a href={t.url} className="link" target="_blank" rel="noopener noreferrer">{t.ticketNo}</a> -
                                <span>{t.summary}</span>
                            </td>
                            {dates.map((day, j) => <td key={j}>
                                {breakupMode !== '2' && <span title={this.getComments(t.logs[day.prop])}>{convertSecs(this.getTotalTime(t.logs[day.prop]))}</span>}
                                {breakupMode === '2' && <div> {this.getLogEntries(t.logs[day.prop])}</div>}
                            </td>)}
                            <td>{convertSecs(t.totalHours)}</td>
                        </tr>
                    ))
                }
            </>
        );
    }
}