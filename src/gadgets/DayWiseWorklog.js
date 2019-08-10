import React from 'react';
import BaseGadget from './BaseGadget';
import { inject } from '../services';
import moment from 'moment';
import { DatePicker, Button } from '../controls';
import GroupEditor from '../dialogs/GroupEditor';
import WorklogSettings from '../dialogs/WorklogSettings';
import { ScrollableTable, THead, NoDataRow, TBody, TRow, Column } from '../components/ScrollableTable';
import { TabView, TabPanel } from 'primereact/tabview';

class DayWiseWorklog extends BaseGadget {
    constructor(props) {
        super(props, 'Logged Work - [User - Day wise]', 'fa-list-alt');
        inject(this, "SessionService", "CacheService", "UtilsService", "UserUtilsService", "DataTransformService", "JiraService", "MessageService", "ConfigService", "UserGroupService");

        //$facade.getUserGroups().then(grps => this.state.groups = grps);
        var pageSettings = this.$session.pageSettings.reports_UserDayWise;
        if (!pageSettings.timeZone) {
            pageSettings.timeZone = '1';
        }

        this.state = { dateRange: {}, pageSettings };
        var { maxHours, epicNameField } = this.$session.CurrentUser;

        this.maxSecsPerDay = (maxHours || 8) * 60 * 60;
        this.epicNameField = (epicNameField || {}).id;
        //this.onResize({ target: window });
    }

    componentWillMount() {
        this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
    }

    dateSelected = (date) => {
        if (!date) { return; }

        if (date.fromDate && date.toDate) {
            this.setState({ dateRange: date }, this.generateReport);
        }
    }

    generateReport = () => {
        var { groups } = this.state;

        if (!groups || groups.length === 0) {
            this.$message.warning("User list need to be added before generating report", "Missing input");
            return;
        }
        this.userList = groups.union(grps => grps.users.ForEach(gu => gu.groupName = grps.name));
        var req = {
            userList: this.userList.map(u => u.name.toLowerCase()),
            fromDate: this.state.dateRange.fromDate,
            toDate: this.state.dateRange.toDate
        };

        this.setState({ isLoading: true });

        this.getDayWiseReportData(req).then(res => {
            //this.processReportData(res);
            this.generateGroupData(res);
            this.generateFlatData(res);
            this.generateSummary(this.flatData);

            this.setState({ isLoading: false });
            this.onResize({ target: window });
        });
    }

    getDayWiseReportData(req) {
        var userList = req.userList.distinct();
        var mfromDate = moment(req.fromDate).startOf('day');
        var mtoDate = moment(req.toDate).endOf('day');
        var fromDate = mfromDate.toDate();
        var toDate = mtoDate.toDate();
        var dateArr = this.getDateArray(fromDate, toDate);
        this.dates = dateArr.map(d => {
            return {
                prop: d.format('yyyyMMdd'),
                display: d.format('DDD, dd'),
                date: d,
                isHoliday: this.$userutils.isHoliday(d)
            };
        });
        this.months = dateArr.groupBy((d) => d.format("MMM, yyyy")).map(grp => { return { monthName: grp.key, days: grp.values.length }; });
        var additionalJQL = (this.state.pageSettings.jql || '').trim();
        if (additionalJQL) {
            additionalJQL = ' AND (' + additionalJQL + ')';
        }
        var jql = "worklogAuthor in ('" + userList.join("','") + "') and worklogDate >= '"
            + mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD") + "' and worklogDate < '" + mtoDate.clone().add(1, 'days').format("YYYY-MM-DD") + "'"
            + additionalJQL;
        var fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project"];
        var epicNameField = this.epicNameField;
        if (epicNameField) {
            fieldsToFetch.push(epicNameField);
        }
        return this.$jira.searchTickets(jql, fieldsToFetch) //, "status", "assignee"
            .then((issues) => {
                var arr = userList.map((u) => { return { logData: [], userName: u.toLowerCase() }; });
                var report = {};
                for (var x = 0; x < arr.length; x++) {
                    var a = arr[x];
                    report[a.userName] = a;
                }
                for (var iss = 0; iss < issues.length; iss++) {
                    var issue = issues[iss];
                    var fields = issue.fields || {};
                    var worklogs = (fields.worklog || {}).worklogs || [];
                    for (var i = 0; i < worklogs.length; i++) {
                        var worklog = worklogs[i];
                        var startedTime = moment(worklog.started).toDate();
                        var startedDate = moment(worklog.started).startOf("day").toDate();
                        if (startedDate.getTime() >= fromDate.getTime() && startedDate.getTime() <= toDate.getTime()) {
                            var reportUser = report[worklog.author.name.toLowerCase()];
                            if (reportUser) {
                                var obj = {
                                    ticketNo: issue.key,
                                    epicDisplay: null,
                                    epicUrl: null,
                                    url: this.$userutils.getTicketUrl(issue.key),
                                    issueType: (fields.issuetype || "").name,
                                    parent: (fields.parent || "").key,
                                    summary: fields.summary,
                                    logTime: startedTime,
                                    comment: worklog.comment,
                                    projectName: fields.project.name,
                                    projectKey: fields.project.key,
                                    totalHours: worklog.timeSpentSeconds
                                };
                                if (epicNameField) {
                                    obj.epicDisplay = fields[epicNameField];
                                    var key = obj.ticketNo.split('-')[0];
                                    if (obj.epicDisplay && obj.epicDisplay.indexOf(key + '-') === 0) {
                                        obj.epicUrl = this.$userutils.getTicketUrl(obj.epicDisplay);
                                    }
                                }
                                reportUser.logData.push(obj);
                            }
                        }
                    }
                }
                for (var j = 0; j < arr.length; j++) {
                    var userData = arr[j];
                    userData.totalHours = userData.logData.sum((t) => { return t.totalHours; });
                }
                return arr;
            });
    }

    generateGroupData(data) {
        var timezoneSetting = parseInt(this.state.pageSettings.timeZone);
        var { groups } = this.state;
        this.groupedData = groups.map(grp => {
            var grpInfo = {
                name: grp.name,
                total: {},
                grandTotal: 0,
                users: null
            };
            grpInfo.users = grp.users.map(usr => {
                var curTimeZone = null;
                if (timezoneSetting === 2) {
                    curTimeZone = grp.timeZone;
                }
                else if (timezoneSetting === 3) {
                    curTimeZone = usr.timeZone || grp.timeZone;
                }
                if (curTimeZone === "GRP_TZ") {
                    curTimeZone = grp.timeZone;
                }
                var usrInfo = {
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
                var logData = data.first(d => d.userName === usr.name.toLowerCase()).logData;
                usrInfo.tickets = logData.groupBy(lGrp => lGrp.ticketNo)
                    .map(tGrp => {
                        var items = tGrp.values;
                        var firstTkt = items.first();
                        var logs = {};
                        var ticket = {
                            ticketNo: tGrp.key,
                            parent: firstTkt.parent,
                            parentUrl: firstTkt.parent ? this.$userutils.getTicketUrl(firstTkt.parent) : null,
                            epicDisplay: firstTkt.epicDisplay,
                            epicUrl: firstTkt.epicUrl,
                            issueType: firstTkt.issueType,
                            summary: firstTkt.summary,
                            url: firstTkt.url,
                            logs: logs,
                            totalHours: 0
                        };
                        let totalHours = 0;
                        items.ForEach(item => {
                            var logTime = item.logTime;
                            if (curTimeZone) {
                                logTime = moment(moment(logTime).tz(curTimeZone).format('YYYY-MM-DD HH:mm:ss')).toDate();
                            }
                            var dateFormated = logTime.format('yyyyMMdd');
                            var logForDate = logs[dateFormated];
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
                var logClass = usrInfo.logClass;
                var usrTotal = usrInfo.total;
                var usrGTotal = 0;
                this.dates.forEach(d => {
                    var totalHrs = usrInfo.tickets.sum(t => {
                        var lgArr = t.logs[d.prop];
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
            var grpTotal = grpInfo.total;
            var grpGTotal = 0;
            this.dates.forEach(d => {
                var totalHrs = grpInfo.users.sum(u => u.total[d.prop] || 0);
                if (totalHrs > 0) {
                    grpTotal[d.prop] = totalHrs;
                    grpGTotal += totalHrs;
                }
            });
            grpInfo.grandTotal = grpGTotal;
            return grpInfo;
        });
        // Set date wise total for all groups
        var grandTotal = 0;
        var grpTotal = {};
        this.dates.forEach(d => {
            var totalHrs = this.groupedData.sum(u => u.total[d.prop] || 0);
            if (totalHrs > 0) {
                grpTotal[d.prop] = totalHrs;
                grandTotal += totalHrs;
            }
        });
        this.groupedData.grandTotal = grandTotal;
        this.groupedData.total = grpTotal;
    }

    generateFlatData(data) {
        this.flatData = this.state.groups.union(grp => {
            var groupName = grp.name;
            return grp.users.union(usr => {
                var userName = usr.displayName;
                return data.first(d => d.userName === usr.name.toLowerCase()).logData
                    .map(log => {
                        return {
                            groupName: groupName,
                            userDisplay: userName,
                            parent: log.parent,
                            parentUrl: log.parent ? this.$userutils.getTicketUrl(log.parent) : null,
                            epicDisplay: log.epicDisplay,
                            epicUrl: log.epicUrl,
                            ticketNo: log.ticketNo,
                            ticketUrl: log.url,
                            issueType: log.issueType,
                            summary: log.summary,
                            projectKey: log.projectKey,
                            projectName: log.projectName,
                            logTime: log.logTime,
                            timeSpent: log.totalHours,
                            comment: log.comment
                        };
                    });
            });
        });
    }

    generateSummary(flatData) {
        debugger;
    }

    processReportData(data) {
        var param = { fromDate: this.state.dateRange.fromDate, toDate: this.state.dateRange.toDate, dateArr: [] };
        data.forEach((d) => {
            var usr = this.userList.first((u) => u.name.toLowerCase() === d.userName.toLowerCase());
            d.userName = usr.name;
            d.displayName = usr.displayName;
            d.userEmail = usr.emailAddress;
            d.groupName = usr.groupName;
            delete usr.groupName;
            d.jiraUser = usr;
        });
        var dateArr = this.getDateArray(param.fromDate, param.toDate);
        param.dateArr = dateArr;
        var months = dateArr.distinct((d) => { return d.format("MMM, yyyy"); })
            .map((m) => {
                return {
                    monthName: m,
                    dates: dateArr.filter((d) => { return d.format("MMM, yyyy") === m; })
                };
            });
        data.forEach((u) => {
            u.profileImgUrl = this.$utils.getProfileImgUrl(u);
            u.ticketWise = u.logData.distinctObj((t) => {
                return {
                    ticketNo: t.ticketNo,
                    url: this.$userutils.getTicketUrl(t.ticketNo),
                    summary: t.summary,
                    parent: t.parent,
                    parentUrl: this.$userutils.getTicketUrl(t.parent),
                };
            });
            u.ticketWise.forEach((t) => {
                var tickets = u.logData.filter((l) => {
                    return l.ticketNo === t.ticketNo;
                });
                t.totalHours = tickets.sum((l) => { return l.totalHours; });
                var dates = tickets.distinct((l) => { return this.$utils.convertDate(l.logTime).format("yyyyMMdd"); });
                dates.forEach((d) => {
                    t[d] = tickets.filter((l) => {
                        return this.$utils.convertDate(l.logTime).format("yyyyMMdd") === d;
                    }).map((l) => {
                        return {
                            logTime: l.logTime,
                            totalHours: l.totalHours,
                            comment: l.comment
                        };
                    });
                });
            });
        });
        this.bindReportData(dateArr, data, months);
    }

    bindReportData(dateArr, data, months) {
        if (!dateArr && !data) {
            var obj = this.$cache.session.get("lastViewed_DayWiseRpt");
            if (obj) {
                dateArr = obj.dateRanges;
                data = obj.logs;
                months = obj.months;
            }
        }
        else {
            this.$cache.session.set("lastViewed_DayWiseRpt", { dateRanges: dateArr, logs: data, months: months });
        }
        this.dates = dateArr;
        this.userDayWise = data;
        this.months = months;
        //this.setContSize(); // ToDo
    }

    filterUserData(arr, date) {
        let tmp = date.format('yyyyMMdd');
        return arr.filter((d) => { return this.$utils.convertDate(d.logTime).format('yyyyMMdd') === tmp; }).sum(d => d.totalHours);
    }

    getGroupTotal(groupName, date) {
        var groupdUsers = this.userDayWise;
        if (groupName) {
            groupdUsers = groupdUsers.filter(g => g.groupName === groupName);
        }
        if (date) {
            let tmp = date.format('yyyyMMdd');
            return groupdUsers.union(g => g.logData)
                .filter((d) => { return this.$utils.convertDate(d.logTime).format('yyyyMMdd') === tmp; }).sum(d => d.totalHours);
        }
        else {
            return groupdUsers.sum(d => d.totalHours);
        }
    }

    getCssClass(day, time) {
        time = time > 0 ? time : 0;
        if (day.isHoliday) {
            return time ? 'log-high' : 'col-holiday';
        }
        else {
            var secsPerDay = this.maxSecsPerDay;
            if (time === secsPerDay)
                return 'log-good';
            else if (time < secsPerDay)
                return 'log-less';
            else if (time > secsPerDay)
                return 'log-high';
        }
    }

    getComments = (arr) => {
        if (!arr || arr.length === 0) {
            return "";
        }
        var param = { format: this.state.pageSettings.logFormat === '1' };
        return arr.map((a) => {
            return this.$userutils.formatTime(a.logTime) + "(" + this.$transform.convertSecs(a.totalHours, param) + ") - " + a.comment;
        }).join(';\n');
    }

    getTotalTime(arr) {
        if (!arr || arr.length === 0) {
            return "";
        }
        return arr.sum((a) => { return a.totalHours; });
    }

    getDateArray(startDate, endDate) {
        var interval = 1;
        var retVal = [];
        var current = new Date(startDate);
        while (current <= endDate) {
            retVal.push(new Date(current));
            current = current.addDays(interval);
        }
        return retVal;
    }

    saveSettings() {
        this.$config.saveSettings('reports_UserDayWise');
    }

    showGroupsPopup = () => this.setState({ showGroupsPopup: true });
    showSettings = () => this.setState({ showSettings: true });

    renderCustomActions() {
        var { isGadget, state: { dateRange } } = this;

        return <>
            <DatePicker value={dateRange} range={true} onChange={this.dateSelected} style={{ marginRight: '35px' }} />
            <Button icon="fa fa-users" onClick={this.showGroupsPopup} title="Add users / groups to report" />
            {super.getFullScreenButton()}
            {!isGadget && <Button icon="fa fa-refresh" onClick={this.generateReport} title="Refresh data" />}
            {/*(groupedData || flatData) && <div jaexport element="tblGrp || tblFlat || wldiv" filename="User Daywise Worklogs" />*/}
            <Button icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />
        </>
    }

    groupsChanged = (groups) => {
        this.setState({ showGroupsPopup: false, groups });
    }

    settingsChanged = (pageSettings) => {
        if (!pageSettings) {
            pageSettings = this.state.pageSettings;
        }
        this.setState({ showSettings: false, pageSettings });
    }

    convertSecs = (val, format) => {
        return this.$transform.convertSecs(val, format);
    }

    formatTime = (val) => {
        return this.$userutils.formatTime(val);
    }

    formatDateTime = (val) => {
        return this.$userutils.formatDateTime(val);
    }

    render() {
        var {
            months, dates, convertSecs, getComments, getTotalTime, formatTime, formatDateTime,
            //props: { },
            groupedData, flatData,
            state: { isLoading, showGroupsPopup, showSettings, groups, pageSettings }
        } = this;
        var { logFormat, breakupMode } = pageSettings;

        return super.renderBase(
            <div>
                {!groupedData && !isLoading && <div className="pad-15">
                    <strong>How to use:</strong>
                    <ul>
                        <li>
                            Choose a date for which you would like to view the report or click the refresh
                            ( <i className="fa fa-refresh"></i> ) icon to load the report if date is already selected.
                        </li>
                        <li>You can choose the list of users by clicking the ( <i className="fa fa-users"></i> ) icon.</li>
                        <li>
                            Click on Settings <i className="fa fa-arrow-right"></i> User groups from left hand menu to add users
                            permenantly to a group and use it in future.
                        </li>
                        <li>Click on ( <i className="fa fa-cogs"></i> ) icon to change the settings of the report.</li>
                        <li>
                            Time zone settings - Configure the time zone of each user & group properly
                            while adding in group and select appropriate option in settings as well.
                        </li>
                        <li>
                            You have additional settings affecting this report in Settings <i className="fa fa-arrow-right"></i>
                            General menu in left hand side.
                        </li>
                        <li>
                            <strong>New: JQL filter - </strong> Add additional filters to restrict certain data to be pulled for report generation.
                        </li>
                    </ul>
                    <p>
                        <strong>Note:</strong> Any changes you make to the group or the users under the group in this page will
                        not get saved and is only for this session.
                    </p>
                    <div>
                        <strong>Planned enhancements:</strong> Some of the enhancements in roadmap for this reports are as follows
                        <ul>
                            <li>Viewing report based on sprint as an additional option alternate for date selection</li>
                            <li>Add custom columns to the report</li>
                        </ul>
                    </div>
                </div>}

                {isLoading && <div className="pad-15">Loading... please wait while the report is being loaded.
                It may take few seconds / minute based on the range you had selected.</div>}

                {groupedData && <TabView>
                    <TabPanel header="Grouped - [User daywise]" contentClassName="no-padding">
                        {groupedData && <ScrollableTable>
                            <THead>
                                <tr className="data-center pad-min auto-wrap">
                                    <th style={{ minWidth: 380 }} rowSpan={2}>User Details</th>
                                    {months.map((day) => <th style={{ minWidth: 35 }} colSpan={day.days}>{day.monthName}</th>)}
                                    <th style={{ minWidth: 50 }} rowSpan={2}>Total Hours</th>
                                </tr>
                                <tr className="pad-min auto-wrap">
                                    {dates.map((day) => <th style={{ minWidth: 35 }}>{day.display}</th>)}
                                </tr>
                            </THead>
                            <NoDataRow span={9}>No records exists</NoDataRow>
                            <TBody>
                                {
                                    groupedData.map(grp => (
                                        <>
                                            <tr className="grouped-row left" hidden={grp.hidden} no-export>
                                                <td colSpan={dates.length + 2} onClick={() => grp.hidden = true}>
                                                    <i className="pull-left drill-down fa fa-chevron-circle-down" title="Click to hide user details" />
                                                    {grp.name}
                                                </td>
                                            </tr>

                                            {
                                                grp.users.map(u => (
                                                    <>
                                                        <tr className="pointer" onClick={() => u.expanded = !u.expanded} hidden={grp.hidden}>
                                                            <td className="data-left">
                                                                <div className="user-info" style={{ paddingLeft: 0 }}>
                                                                    <i className={"pull-left drill-down fa" + (u.expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right')}
                                                                        title="Click to toggle ticket details" />
                                                                    <img src={u.imageUrl} height={40} width={40} className="pull-left" alt={u.displayName} />
                                                                    <span className="name">{u.displayName}</span>
                                                                    <span className="email">({u.emailAddress}{u.timeZone && <span>, time zone: {u.timeZone}</span>})</span>
                                                                </div>
                                                            </td>
                                                            {dates.map(day => <td className={u.logClass[day.prop]}>{convertSecs(u.total[day.prop], logFormat === '1')}</td>)}
                                                            <td>{convertSecs(u.grandTotal, logFormat === '1')}</td>
                                                        </tr>

                                                        {
                                                            u.tickets.map(t => (
                                                                <tr className={!u.expanded ? 'hide' : ''} hidden={!u.expanded || grp.hidden}>
                                                                    <td className="data-left">
                                                                        {t.parent && <a href={t.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{t.parent} - </a>}
                                                                        <a href={t.url} className="link" target="_blank" rel="noopener noreferrer">{t.ticketNo}</a> -
                                                                <span>{t.summary}</span>
                                                                    </td>
                                                                    {dates.map(day => <td ngswitch={breakupMode} >
                                                                        {breakupMode !== '2' && <span title={getComments(t.logs[day.prop])}>{convertSecs(getTotalTime(t.logs[day.prop]), logFormat === '1')}</span>}
                                                                        {breakupMode === '2' && <div> {t.logs[day.prop].map(d => <span title={formatTime(d.logTime) + " - " + d.comment}> {convertSecs(d.totalHours, logFormat === '1')}; </span>)}</div>}
                                                                    </td>)}
                                                                    <td>{convertSecs(t.totalHours, logFormat === '1')}</td>
                                                                </tr>
                                                            ))
                                                        }
                                                    </>
                                                ))
                                            }

                                            <tr className="grouped-row right" onClick={() => grp.hidden = false} no-export>
                                                <td>
                                                    <div hidden={!grp.hidden}>
                                                        <i className="pull-left drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                                                        <span className="pull-left">{grp.name}</span><span className="pull-right">Total <i className="fa fa-arrow-right" /></span>
                                                    </div>
                                                    <div hidden={grp.hidden}>
                                                        {grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" />
                                                    </div>
                                                </td>
                                                {dates.map(day => <td>{convertSecs(grp.total[day.prop], logFormat === '1')}</td>)}
                                                <td>{convertSecs(grp.grandTotal, logFormat === '1')}</td>
                                            </tr>
                                        </>
                                    ))
                                }

                                <tr className="grouped-row right" no-export>
                                    <td>Grand Total <i className="fa fa-arrow-right" /></td>
                                    {dates.map((day) => <td>{convertSecs(groupedData.total[day.prop], logFormat === '1')}</td>)}
                                    <td>{convertSecs(groupedData.grandTotal, logFormat === '1')}</td>
                                </tr>
                            </TBody >
                        </ScrollableTable>}
                    </TabPanel>
                    <TabPanel header="Flat">
                        {flatData && <ScrollableTable dataset={flatData}>
                            <THead>
                                <TRow>
                                    <Column sortBy="groupName">Group Name</Column>
                                    <Column sortBy="projectName">Project Name</Column>
                                    <Column sortBy="issueType">Type</Column>
                                    <Column sortBy="epicDisplay">Epic</Column>
                                    <Column sortBy="parent">Parent</Column>
                                    <Column sortBy="ticketNo">Ticket No</Column>
                                    <Column sortBy="summary">Summary</Column>
                                    <Column sortBy="logTime">Log Date & Time</Column>
                                    <Column sortBy="userDisplay">User</Column>
                                    <Column sortBy="timeSpent">Hr. Spent</Column>
                                    <Column sortBy="comment">Comment</Column>
                                </TRow>
                            </THead>
                            <TBody>
                                {row => <tr>
                                    <td>{row.groupName}</td>
                                    <td>{row.projectName}</td>
                                    <td>{row.issueType}</td>
                                    <td>{row.epicDisplay && <a href={row.epicUrl} className="link" target="_blank" rel="noopener noreferrer">{row.epicDisplay}</a>}</td>
                                    <td>{row.parent && <a href={row.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{row.parent}</a>}</td>
                                    <td><a href={row.ticketUrl} className="link" target="_blank" rel="noopener noreferrer">{row.ticketNo}</a></td>
                                    <td>{row.summary}</td>
                                    <td>{formatDateTime(row.logTime)}</td>
                                    <td>{row.userDisplay}</td>
                                    <td>{convertSecs(row.timeSpent, logFormat === '1')}</td>
                                    <td>{row.comment}</td>
                                </tr>}
                            </TBody>
                        </ScrollableTable>}
                    </TabPanel>
                </TabView>}

                {showGroupsPopup && <GroupEditor groups={groups} onHide={this.groupsChanged} />}
                {showSettings && <WorklogSettings pageSettings={pageSettings} onHide={this.settingsChanged} />}
            </div>
        );
    }
}

export default DayWiseWorklog;