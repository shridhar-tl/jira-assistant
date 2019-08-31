import React from 'react';
import BaseGadget from '../BaseGadget';
import { inject } from '../../services';
import moment from 'moment';
import { DatePicker, Button } from '../../controls';
import GroupEditor from '../../dialogs/GroupEditor';
import WorklogSettings from './WorklogSettings';
import { TabView, TabPanel } from 'primereact/tabview';
import FlatDataGrid from './FlatDataGrid';
import GroupedDataGrid from './GroupedDataGrid';
import WorklogReportInfo from './WorklogReportInfo';
import "./WorklogGadget.scss";

class WorklogGadget extends BaseGadget {
    constructor(props) {
        super(props, 'Logged Work - [User - Day wise]', 'fa-list-alt');
        inject(this, "SessionService", "CacheService", "UtilsService", "UserUtilsService", "JiraService", "MessageService", "ConfigService", "UserGroupService");

        //$facade.getUserGroups().then(grps => this.state.groups = grps);
        const pageSettings = this.$session.pageSettings.reports_UserDayWise;
        if (!pageSettings.timeZone) {
            pageSettings.timeZone = '1';
        }

        this.state.dateRange = {};
        this.state.pageSettings = pageSettings;
        const { maxHours, epicNameField } = this.$session.CurrentUser;

        this.maxSecsPerDay = (maxHours || 8) * 60 * 60;
        this.epicNameField = (epicNameField || {}).id;
        //this.onResize({ target: window });
    }

    UNSAFE_componentWillMount() {
        this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
    }

    dateSelected = (date) => {
        if (!date) { return; }

        if (date.fromDate && date.toDate) {
            this.setState({ dateRange: date }, this.generateReport);
        }
    }

    generateReport = () => {
        const { groups } = this.state;

        if (!groups || groups.length === 0) {
            this.$message.warning("User list need to be added before generating report", "Missing input");
            return;
        }
        this.userList = groups.union(grps => {
            grps.users.forEach(gu => gu.groupName = grps.name);
            return grps.users;
        });
        const req = {
            userList: this.userList.map(u => u.name.toLowerCase()),
            fromDate: this.state.dateRange.fromDate,
            toDate: this.state.dateRange.toDate
        };

        this.setState({ isLoading: true });

        this.getDayWiseReportData(req).then(res => {
            //this.processReportData(res);
            this.rawData = res;
            this.generateFlatData(res);

            this.setState({ isLoading: false });
            this.onResize({ target: window });
        });
    }

    getDayWiseReportData(req) {
        const userList = req.userList.distinct();
        const mfromDate = moment(req.fromDate).startOf('day');
        const mtoDate = moment(req.toDate).endOf('day');
        const fromDate = mfromDate.toDate();
        const toDate = mtoDate.toDate();
        const dateArr = this.getDateArray(fromDate, toDate);
        this.dates = dateArr.map(d => {
            return {
                prop: d.format('yyyyMMdd'),
                display: d.format('DDD, dd'),
                date: d,
                isHoliday: this.$userutils.isHoliday(d)
            };
        });
        this.months = dateArr.groupBy((d) => d.format("MMM, yyyy")).map(grp => { return { monthName: grp.key, days: grp.values.length }; });
        let additionalJQL = (this.state.pageSettings.jql || '').trim();
        if (additionalJQL) {
            additionalJQL = ` AND (${additionalJQL})`;
        }
        const jql = `worklogAuthor in ('${userList.join("','")}') and worklogDate >= '${
            mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${mtoDate.clone().add(1, 'days').format("YYYY-MM-DD")}'${
            additionalJQL}`;
        const fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project"];
        const epicNameField = this.epicNameField;
        if (epicNameField) {
            fieldsToFetch.push(epicNameField);
        }
        return this.$jira.searchTickets(jql, fieldsToFetch) //, "status", "assignee"
            .then((issues) => {
                const arr = userList.map((u) => { return { logData: [], userName: u.toLowerCase() }; });
                const report = {};
                for (let x = 0; x < arr.length; x++) {
                    const a = arr[x];
                    report[a.userName] = a;
                }
                for (let iss = 0; iss < issues.length; iss++) {
                    const issue = issues[iss];
                    const fields = issue.fields || {};
                    const worklogs = (fields.worklog || {}).worklogs || [];
                    for (let i = 0; i < worklogs.length; i++) {
                        const worklog = worklogs[i];
                        const startedTime = moment(worklog.started).toDate();
                        const startedDate = moment(worklog.started).startOf("day").toDate();
                        if (startedDate.getTime() >= fromDate.getTime() && startedDate.getTime() <= toDate.getTime()) {
                            const reportUser = report[worklog.author.name.toLowerCase()];
                            if (reportUser) {
                                const obj = {
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
                                    const key = obj.ticketNo.split('-')[0];
                                    if (obj.epicDisplay && obj.epicDisplay.indexOf(`${key}-`) === 0) {
                                        obj.epicUrl = this.$userutils.getTicketUrl(obj.epicDisplay);
                                    }
                                }
                                reportUser.logData.push(obj);
                            }
                        }
                    }
                }
                for (let j = 0; j < arr.length; j++) {
                    const userData = arr[j];
                    userData.totalHours = userData.logData.sum((t) => { return t.totalHours; });
                }
                return arr;
            });
    }

    generateFlatData(data) {
        this.flatData = this.state.groups.union(grp => {
            const groupName = grp.name;
            return grp.users.union(usr => {
                const userName = usr.displayName;
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

    processReportData(data) {
        const param = { fromDate: this.state.dateRange.fromDate, toDate: this.state.dateRange.toDate, dateArr: [] };
        data.forEach((d) => {
            const usr = this.userList.first((u) => u.name.toLowerCase() === d.userName.toLowerCase());
            d.userName = usr.name;
            d.displayName = usr.displayName;
            d.userEmail = usr.emailAddress;
            d.groupName = usr.groupName;
            delete usr.groupName;
            d.jiraUser = usr;
        });
        const dateArr = this.getDateArray(param.fromDate, param.toDate);
        param.dateArr = dateArr;
        const months = dateArr.distinct((d) => { return d.format("MMM, yyyy"); })
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
                const tickets = u.logData.filter((l) => {
                    return l.ticketNo === t.ticketNo;
                });
                t.totalHours = tickets.sum((l) => { return l.totalHours; });
                const dates = tickets.distinct((l) => { return this.$utils.convertDate(l.logTime).format("yyyyMMdd"); });
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
            const obj = this.$cache.session.get("lastViewed_DayWiseRpt");
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
        const tmp = date.format('yyyyMMdd');
        return arr.filter((d) => { return this.$utils.convertDate(d.logTime).format('yyyyMMdd') === tmp; }).sum(d => d.totalHours);
    }

    getGroupTotal(groupName, date) {
        let groupdUsers = this.userDayWise;
        if (groupName) {
            groupdUsers = groupdUsers.filter(g => g.groupName === groupName);
        }
        if (date) {
            const tmp = date.format('yyyyMMdd');
            return groupdUsers.union(g => g.logData)
                .filter((d) => { return this.$utils.convertDate(d.logTime).format('yyyyMMdd') === tmp; }).sum(d => d.totalHours);
        }
        else {
            return groupdUsers.sum(d => d.totalHours);
        }
    }

    getDateArray(startDate, endDate) {
        const interval = 1;
        const retVal = [];
        let current = new Date(startDate);
        while (current <= endDate) {
            retVal.push(new Date(current));
            current = current.addDays(interval);
        }
        return retVal;
    }

    showGroupsPopup = () => this.setState({ showGroupsPopup: true });
    showSettings = () => this.setState({ showSettings: true });

    renderCustomActions() {
        const { isGadget, state: { dateRange } } = this;

        return <>
            <DatePicker value={dateRange} range={true} onChange={this.dateSelected} style={{ marginRight: '35px' }} />
            <Button icon="fa fa-users" onClick={this.showGroupsPopup} title="Add users / groups to report" />
            {super.getFullScreenButton()}
            {!isGadget && <Button icon="fa fa-refresh" onClick={this.generateReport} title="Refresh data" />}
            {/*(groupedData || flatData) && <div jaexport element="tblGrp || tblFlat || wldiv" filename="User Daywise Worklogs" />*/}
            <Button icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />
        </>;
    }

    groupsChanged = (groups) => this.setState({ showGroupsPopup: false, groups })

    settingsChanged = (pageSettings) => {
        if (!pageSettings) {
            pageSettings = this.state.pageSettings;
        }
        this.setState({ showSettings: false, pageSettings });
    }

    convertSecs = (val) => {
        return this.$utils.convertSecs(val, { format: this.state.pageSettings.logFormat === "1" });
    }

    formatTime = (val) => {
        return this.$userutils.formatTime(val);
    }

    formatDateTime = (val) => {
        return this.$userutils.formatDateTime(val);
    }

    render() {
        const {
            months, dates, convertSecs, formatTime, formatDateTime,
            //props: { },
            rawData, flatData,
            state: { isLoading, showGroupsPopup, showSettings, groups, pageSettings }
        } = this;
        const { breakupMode } = pageSettings;

        return super.renderBase(
            <div className="worklog-gadget-container">
                {!rawData && !isLoading && <WorklogReportInfo />}

                {isLoading && <div className="pad-15">Loading... please wait while the report is being loaded.
                It may take few seconds / minute based on the range you had selected.</div>}

                {rawData && <TabView className="no-padding">
                    <TabPanel header="Grouped - [User daywise]" contentClassName="no-padding">
                        {rawData && <GroupedDataGrid rawData={rawData} groups={groups} dates={dates} months={months} pageSettings={pageSettings}
                            convertSecs={convertSecs} formatTime={formatTime} breakupMode={breakupMode} getTicketUrl={this.$userutils.getTicketUrl} maxSecsPerDay={this.maxSecsPerDay} />}
                    </TabPanel>
                    <TabPanel header="Flat">
                        {flatData && <FlatDataGrid flatData={flatData} formatDateTime={formatDateTime} convertSecs={convertSecs} />}
                    </TabPanel>
                </TabView>}

                {showGroupsPopup && <GroupEditor groups={groups} onHide={this.groupsChanged} />}
                {showSettings && <WorklogSettings pageSettings={pageSettings} onHide={this.settingsChanged} />}
            </div>
        );
    }
}

export default WorklogGadget;

