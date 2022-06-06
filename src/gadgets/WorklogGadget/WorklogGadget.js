/* eslint-disable complexity */
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
import UserProjectWiseSummary from './UserProjectWiseSummary';
import { EventCategory } from '../../_constants';
import { getUserName } from '../../common/utils';
import AddWorklog from '../../dialogs/AddWorklog';

class WorklogGadget extends BaseGadget {
    constructor(props) {
        super(props, 'Worklog Report', 'fa-list-alt');
        inject(this, "SessionService", "CacheService", "UtilsService", "UserUtilsService", "JiraService", "MessageService", "ConfigService", "UserGroupService", "AnalyticsService");

        const pageSettings = this.$session.pageSettings.reports_UserDayWise;
        if (!pageSettings.timeZone) {
            pageSettings.timeZone = '1';
        }

        this.state.dateRange = {};
        this.state.pageSettings = pageSettings;
        const { maxHours, epicNameField, name } = this.$session.CurrentUser;
        this.currentUserName = name.toLowerCase();

        this.maxSecsPerDay = (maxHours || 8) * 60 * 60;
        this.epicNameField = (epicNameField || {}).id;
    }

    UNSAFE_componentWillMount() {
        this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
    }

    dateSelected = (date) => {
        if (!date) { return; }

        if (date.fromDate && date.toDate) {
            this.setState({ dateRange: date }, this.refreshData);
        }
    };

    refreshData = () => {
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
            userList: this.userList.map(u => getUserName(u, true)),
            fromDate: this.state.dateRange.fromDate,
            toDate: this.state.dateRange.toDate
        };

        this.setState({ isLoading: true });

        this.getDayWiseReportData(req).then(res => {
            this.$analytics.trackEvent("Worklog report viewed", EventCategory.UserActions);
            //this.processReportData(res);
            this.rawData = res;
            this.generateFlatData(res);

            this.setState({ isLoading: false });
            this.onResize({ target: window });
        });
    };

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
        const hideEstimate = this.state.pageSettings.hideEstimate;
        let additionalJQL = (this.state.pageSettings.jql || '').trim();
        if (additionalJQL) {
            additionalJQL = ` AND (${additionalJQL})`;
        }
        const jql = `worklogAuthor in ("${userList.join('","')}") and worklogDate >= '${mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${mtoDate.clone().add(1, 'days').format("YYYY-MM-DD")}'${additionalJQL}`;
        const fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project", "status", "assignee"];
        if (!hideEstimate) {
            fieldsToFetch.push("timeoriginalestimate");
            fieldsToFetch.push("timeestimate");
        }

        const epicNameField = this.epicNameField;
        if (epicNameField) {
            fieldsToFetch.push(epicNameField);
        }
        return this.$jira.searchTickets(jql, fieldsToFetch) //, "status", "assignee"
            .then((issues) => {
                const arr = userList.map((u) => {
                    const usr = { logData: [], userName: u.toLowerCase() };
                    if (usr.userName === this.currentUserName) {
                        usr.isCurrentUser = true;
                    }
                    return usr;
                });
                const report = {};

                for (let x = 0; x < arr.length; x++) {
                    const a = arr[x];
                    report[a.userName] = a;
                }
                for (let iss = 0; iss < issues.length; iss++) {
                    const issue = issues[iss];
                    const fields = issue.fields || {};
                    const worklogs = (fields.worklog || {}).worklogs || [];
                    const totalLogged = worklogs.sum(wl => wl.timeSpentSeconds);
                    const originalestimate = fields.timeoriginalestimate || 0;
                    const remainingestimate = fields.timeestimate || 0;
                    const estVariance = originalestimate > 0 ? (remainingestimate + totalLogged) - originalestimate : 0;

                    for (let i = 0; i < worklogs.length; i++) {
                        const worklog = worklogs[i];
                        const startedTime = moment(worklog.started).toDate();
                        const startedDate = moment(worklog.started).startOf("day").toDate();
                        if (startedDate.getTime() >= fromDate.getTime() && startedDate.getTime() <= toDate.getTime()) {
                            const reportUser = report[getUserName(worklog.author, true)];
                            if (reportUser) {
                                const obj = {
                                    ticketNo: issue.key,
                                    epicDisplay: null,
                                    epicUrl: null,
                                    url: this.$userutils.getTicketUrl(issue.key),
                                    issueType: fields.issuetype?.name,
                                    parent: fields.parent?.key,
                                    parentSummary: fields.parent?.fields?.summary,
                                    assignee: fields.assignee?.displayName,
                                    summary: fields.summary,
                                    originalestimate,
                                    remainingestimate,
                                    totalLogged,
                                    estVariance,
                                    logTime: startedTime,
                                    comment: worklog.comment,
                                    projectName: fields.project.name,
                                    statusName: fields.status?.name,
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
                    userData.totalHours = userData.logData.sum((t) => t.totalHours);
                }
                return arr;
            });
    }

    generateFlatData(data) {
        this.flatData = this.state.groups.union(grp => {
            const groupName = grp.name;
            return grp.users.union(usr => {
                const userName = usr.displayName;
                return data.first(d => d.userName === getUserName(usr, true)).logData
                    .map(log => {
                        return {
                            groupName: groupName,
                            username: getUserName(usr),
                            userDisplay: userName,
                            parent: log.parent,
                            parentSummary: log.parentSummary,
                            parentUrl: log.parent ? this.$userutils.getTicketUrl(log.parent) : null,
                            epicDisplay: log.epicDisplay,
                            epicUrl: log.epicUrl,
                            ticketNo: log.ticketNo,
                            ticketUrl: log.url,
                            issueType: log.issueType,
                            summary: log.summary,
                            projectKey: log.projectKey,
                            projectName: log.projectName,
                            statusName: log.statusName,
                            logTime: log.logTime,
                            timeSpent: log.totalHours,
                            originalestimate: log.originalestimate,
                            remainingestimate: log.remainingestimate,
                            totalLogged: log.totalLogged,
                            estVariance: log.estVariance,
                            comment: log.comment
                        };
                    });
            });
        });
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
        const { state: { dateRange } } = this;

        return <>
            <DatePicker value={dateRange} range={true} onChange={this.dateSelected} style={{ marginRight: '35px' }} />
            <Button icon="fa fa-users" onClick={this.showGroupsPopup} title="Add users / groups to report" />
            <Button icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />
        </>;
    }

    groupsChanged = (groups) => {
        const newState = { showGroupsPopup: false };
        if (groups && Array.isArray(groups)) { newState.groups = groups; }
        this.setState(newState);
    };

    settingsChanged = (pageSettings) => {
        if (!pageSettings) {
            pageSettings = this.state.pageSettings;
        }
        this.setState({ showSettings: false, pageSettings });
    };

    groupSettingsChanged = (grpSet) => {
        const { groupBy, groupFoldable, displayColumns, sortField, isDesc } = grpSet;
        let { pageSettings } = this.state;
        pageSettings = { ...pageSettings, flatTableSettings: { groupBy, groupFoldable, displayColumns, sortField, isDesc } };

        this.$config.saveSettings('reports_UserDayWise', pageSettings);
        this.settingsChanged(pageSettings);
    };

    addWorklog = (user, ticketNo, dateStarted, logged) => {
        let timeSpent = (this.maxSecsPerDay || 0) - (logged || 0);
        if (timeSpent < 60) {
            timeSpent = "01:00";
        }

        // ToDo: need to support adding worklog for different user
        this.worklogItem = { ticketNo, dateStarted, timeSpent };
        this.setState({ showWorklogPopup: true });
    };

    worklogAdded = ({ added: { sourceObject: worklog } }) => {
        console.log("Worklog added: ", worklog);
    };

    hideWorklog = () => {
        this.worklogItem = null;
        this.setState({ showWorklogPopup: false });
    };

    convertSecs = (val) => {
        if (!val && val !== 0) {
            return val;
        }

        return this.$utils.convertSecs(val, { format: this.state.pageSettings.logFormat === "1" });
    };

    formatTime = (val) => {
        return this.$userutils.formatTime(val);
    };

    formatDateTime = (val) => {
        return this.$userutils.formatDateTime(val);
    };

    render() {
        const {
            months, dates, convertSecs, formatTime, formatDateTime,
            //props: { },
            rawData, flatData = [],
            state: { isLoading, showGroupsPopup, showWorklogPopup, showSettings, groups, pageSettings = {} }
        } = this;

        const { breakupMode, showCostReport } = pageSettings;
        const flatDataUniqueKey = `${pageSettings._uniqueId}_${flatData._uniqueId}`;

        const groupedWorklogTab = (<TabPanel header="Grouped - [User daywise]" contentClassName="no-padding">
            {rawData && <GroupedDataGrid rawData={rawData} groups={groups} dates={dates} months={months}
                pageSettings={pageSettings} convertSecs={convertSecs} formatTime={formatTime} breakupMode={breakupMode}
                getTicketUrl={this.$userutils.getTicketUrl} maxSecsPerDay={this.maxSecsPerDay} addWorklog={this.addWorklog} />}
        </TabPanel>);

        const summaryTab = (<TabPanel header="Summary - [User project wise]">
            {flatData && <UserProjectWiseSummary key={flatDataUniqueKey} groups={groups}
                flatData={flatData} formatDateTime={formatDateTime} convertSecs={convertSecs} />}
        </TabPanel>);

        const flatLogsTab = (<TabPanel header="Flat (Groupable)">
            {flatData && <FlatDataGrid key={flatDataUniqueKey} flatData={flatData}
                formatDateTime={formatDateTime} convertSecs={convertSecs} pageSettings={pageSettings}
                onChange={this.groupSettingsChanged} />}
        </TabPanel>);

        return super.renderBase(
            <div className="worklog-gadget-container">
                {!rawData && !isLoading && <WorklogReportInfo />}

                {isLoading && <div className="pad-15">Loading... please wait while the report is being loaded.
                    It may take few seconds / minute based on the range you had selected.</div>}

                {rawData && !showCostReport && <TabView className="no-padding" renderActiveOnly={false}>
                    {groupedWorklogTab}
                    {summaryTab}
                    {flatLogsTab}
                </TabView>}
                {rawData && showCostReport && <TabView className="no-padding" renderActiveOnly={false}>
                    {groupedWorklogTab}
                    {<TabPanel header="Cost Report" contentClassName="no-padding">
                        {rawData && <GroupedDataGrid rawData={rawData} groups={groups} dates={dates} months={months}
                            pageSettings={pageSettings} costView={true} convertSecs={convertSecs} formatTime={formatTime} breakupMode={breakupMode}
                            getTicketUrl={this.$userutils.getTicketUrl} maxSecsPerDay={this.maxSecsPerDay} />}
                    </TabPanel>}
                    {summaryTab}
                    <TabPanel header="Cost Summary">
                        {flatData && <UserProjectWiseSummary key={flatDataUniqueKey} groups={groups} flatData={flatData}
                            formatDateTime={formatDateTime} convertSecs={convertSecs} costView={true} />}
                    </TabPanel>
                    {flatLogsTab}
                </TabView>}

                {showGroupsPopup && <GroupEditor groups={groups} onHide={this.groupsChanged} />}
                {showSettings && <WorklogSettings pageSettings={pageSettings} onHide={this.settingsChanged} />}
                {showWorklogPopup && <AddWorklog worklog={this.worklogItem} onDone={this.worklogAdded}
                    onHide={this.hideWorklog} uploadImmediately={true} />}
            </div>
        );
    }
}

export default WorklogGadget;

