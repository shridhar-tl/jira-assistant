import React, { PureComponent } from 'react';
import { inject } from '../../services/injector-service';
import moment from 'moment';
import GroupableGrid from '../../components/GroupableGrid/GroupableGrid';
import { DateDisplay, IssueDisplay, ItemDisplay, ProjectDisplay, TicketDisplay, TimeSpentDisplay, UserDisplay } from '../../display-controls';
import './StatusWiseTimeSpent.scss';

class StatusWiseTimeSpent extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService", "SessionService");
        const { epicNameField, storyPointField } = this.$session.CurrentUser;
        this.epicNameField = epicNameField?.id;
        this.storyPointField = storyPointField?.id;
        const fieldNames = [
            "key", "summary", "project", "status", "parent", "assignee", "issuetype", "reporter", "created", "changeLog",
            "timeestimate", "aggregatetimeestimate", "timeoriginalestimate", "aggregatetimeoriginalestimate"
        ];
        if (this.epicNameField) { fieldNames.push(this.epicNameField); }
        if (this.storyPointField) { fieldNames.push(this.storyPointField); }
        this.fieldNames = fieldNames;
        this.state = {};
    }

    componentDidMount() {
        this.fetchData();
    }

    UNSAFE_componentWillReceiveProps(props) {
        const { jql } = props;
        if (this.jql !== jql?.trim()) {
            this.fetchData();
        }
    }

    async fetchData() {
        const { jql, setLoader } = this.props;
        this.jql = jql?.trim();

        if (!this.jql) {
            this.setState({ reportData: [], statusList: [] });
            return;
        }

        if (setLoader) { setLoader(true); }

        try {
            const tickets = await this.$jira.searchTickets(jql, this.fieldNames, 0, { expand: ["changelog"] });
            const currentTime = new Date().getTime();

            const reportData = tickets.map(t => {
                const { key, changelog: { histories } = {}, fields: {
                    summary, status, issuetype, assignee, reporter, created, project, parent,
                    timeestimate, aggregatetimeestimate, timeoriginalestimate, aggregatetimeoriginalestimate,
                    [this.epicNameField]: epic, [this.storyPointField]: storyPoint } } = t;
                const changelog = [];
                let ix = histories.length;
                while (--ix >= 0) {
                    const { created, items } = histories[ix];

                    items.filter(i => i.field === "status")
                        .forEach(i => {
                            const { fromString: from, toString: to } = i;
                            changelog.push({ date: moment(created).toDate().getTime(), from, to });
                        });
                }

                let prevTime = moment(created).toDate().getTime();
                const arrLen = changelog.length - 1;
                const statusData = changelog.reduce((obj, cur, i) => {
                    const { date, from, to } = cur;
                    obj[from] = (obj[from] || 0) + (date - prevTime);
                    prevTime = date;
                    if (arrLen === i) {
                        obj[to] = (obj[to] || 0) + (currentTime - prevTime);
                    }
                    return obj;
                }, {});

                Object.keys(statusData).forEach(key => {
                    if (!statusData[key]) {
                        delete statusData[key];
                    }
                });

                return {
                    key, summary, status, issuetype, assignee, reporter, created, project, parent,
                    timeestimate, aggregatetimeestimate, timeoriginalestimate, aggregatetimeoriginalestimate,
                    statusData, changelog, epic, storyPoint
                };
            });

            const projectList = reportData.distinct(t => t.project.key);
            const statusList = await this.getStatuses(projectList);
            this.columnList = this.getFieldList(statusList);

            this.setState({ reportData, statusList });
        }
        finally {
            if (setLoader) { setLoader(false); }
        }
    }

    getFieldList(statusList) {
        const { onAddWorklog } = this.props;

        const list = [
            { field: "key", displayText: "Ticket No", type: "string", viewComponent: TicketDisplay, props: { onAddWorklog } },
            { field: "summary", displayText: "Summary", type: "string" },
            { field: "project", fieldKey: "project.key", displayText: "Project", type: "string", viewComponent: ProjectDisplay },
            { field: "issuetype", fieldKey: "issuetype.name", displayText: "Issue Type", type: "string", viewComponent: ItemDisplay },
            { field: "epic", displayText: "Epic", type: "string", viewComponent: TicketDisplay, props: { hideWorklog: true } },
            { field: "storyPoint", displayText: "Story Points", type: "number" },
            { field: "timeestimate", displayText: "Time Estimate", type: "number", viewComponent: TimeSpentDisplay },
            { field: "aggregatetimeestimate", displayText: "Σ Time Estimate", type: "number", viewComponent: TimeSpentDisplay },
            { field: "timeoriginalestimate", displayText: "Original Estimate", type: "number", viewComponent: TimeSpentDisplay },
            { field: "aggregatetimeoriginalestimate", displayText: "Σ Original Estimate", type: "number", viewComponent: TimeSpentDisplay },
            { field: "parent", fieldKey: "project.key", displayText: "Parent", type: "string", viewComponent: IssueDisplay, props: { onAddWorklog } },
            { field: "status", fieldKey: "status.name", displayText: "Status", type: "string", viewComponent: ItemDisplay },
            { field: "created", displayText: "Created", type: "datetime", viewComponent: DateDisplay },
            { field: "assignee", fieldKey: "assignee.displayName", displayText: "Assignee", type: "string", viewComponent: UserDisplay },
            { field: "reporter", fieldKey: "reporter.displayName", displayText: "Reporter", type: "string", viewComponent: UserDisplay },
            ...statusList.map(status => ({
                field: `statusData.${status.name}`, displayText: `Spent on ${status.name}`,
                type: "number", viewComponent: TimeSpentDisplay, props: { inputType: "ticks", days: true }
            }))
        ];

        return list;
    }

    async getStatuses(projectList) {
        const sList = await this.$jira.getProjectStatuses(projectList);
        const ids = [];
        const statusList = [];

        sList.forEach(proj => {
            proj.forEach(catg => {
                catg.statuses.forEach(status => {
                    if (~ids.indexOf(status.id)) {
                        return;
                    }
                    const { id, name, iconUrl } = status;
                    ids.push(id);
                    statusList.push({ name, iconUrl });
                });
            });
        });

        return statusList;
    }

    render() {
        const {
            columnList,
            state: { loading, reportData },
            props: { settings, settingsChanged }
        } = this;

        const { displayColumns, groupBy, groupFoldable, sortField, isDesc } = settings || {};

        return (
            <div className="statuswise-ts-grid">
                {!loading && reportData && <GroupableGrid dataset={reportData} exportSheetName="Status wise time spent"
                    columns={columnList} allowSorting={true} onChange={settingsChanged}
                    displayColumns={displayColumns} groupBy={groupBy} groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
                    noRowsMessage="No ticket details available"
                />}
            </div>
        );
    }
}

export default StatusWiseTimeSpent;