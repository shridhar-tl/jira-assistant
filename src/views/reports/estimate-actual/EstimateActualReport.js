import React from 'react';
import moment from 'moment';
import pattern from 'patternomaly';
import { inject } from '../../../services';
import BaseGadget from '../../../gadgets/BaseGadget';
import { TabView, TabPanel } from 'primereact/tabview';
import { AutoComplete, TextBox, Button, DatePicker, RadioButton } from '../../../controls';
import { Chart } from 'primereact/chart';
import GroupEditor from '../../../dialogs/GroupEditor';
import "./EstimateActualReport.scss";

const defaultChartColors = [
    {
        backgroundColor: '#f1c40f4a',
        borderColor: '#f1c40f',
        hoverBackgroundColor: '#f1c40f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#27ae614a',
        borderColor: '#27ae61',
        pointBackgroundColor: 'rgba(77,83,96,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#e84c3d4a',
        borderColor: '#e84c3d',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#8f44ad4a',
        borderColor: '#8f44ad',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#9a8d2f4a',
        borderColor: '#9a8d2f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#3e95cd94',
        borderColor: '#3e95cd',
        hoverBackgroundColor: '#3e95cd',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#8e5ea27a',
        borderColor: '#8e5ea2',
        hoverBackgroundColor: '#8e5ea2',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#3cba9f7d',
        borderColor: '#3cba9f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#e8c3b987',
        borderColor: '#e8c3b9',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#c4585080',
        borderColor: '#c45850',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    }
];

class EstimateActualReport extends BaseGadget {
    constructor(props) {
        super(props, "Estimate vs Actual report", "fa fa-list-alt");
        inject(this, "SessionService", "JiraService", "UserGroup");

        this.isGadget = false;

        this.chartOptions = {
            animation: false,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Estimate vs Actual'
            },
            tooltips: {
                mode: 'index'
            },
            scales: {
                xAxes: [
                    {
                        stacked: false,
                        ticks: {
                            stepSize: 1,
                            min: 0,
                            autoSkip: false
                        },
                        categoryPercentage: 1,
                        barPercentage: 1,
                        barThickness: 'flex'
                    }
                ]
            }
        };
        this.chartColours = defaultChartColors.union(d => [
            Object.assign({}, d, { hoverBackgroundColor: d.borderColor }),
            Object.assign({}, d, { hoverBackgroundColor: pattern.draw('zigzag', d.backgroundColor), backgroundColor: pattern.draw('zigzag', d.borderColor) })
        ]);

        this.storyPointField = (this.$session.CurrentUser.storyPointField || {}).id;

        this.state = { dateRange: {}, chartData: {}, estimationField: 'timeoriginalestimate', projects: this.$session.CurrentUser.projects };
    }

    UNSAFE_componentWillMount() {
        this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
        this.$jira.getProjects().then((projectsList) => {
            projectsList = projectsList.map((d) => { return { name: d.name, key: d.key, id: d.id }; }).orderBy((d) => { return d.name; });
            this.setState({ projectsList });
        });
    }

    searchProject = (query) => {
        query = (query || '').toLowerCase();
        return this.state.projectsList.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.key.toLowerCase().startsWith(query) || r.id.toString().startsWith(query))
            && (!this.state.projects || !this.state.projects.some(v => v.id === r.id)));
    }

    generateReport = () => {
        this.fetchData();
    }

    fetchData() {
        this.setState({ isLoading: true, chartData: {} });
        const mfromDate = moment(this.state.dateRange.fromDate).startOf('day');
        const mtoDate = moment(this.state.dateRange.toDate).endOf('day');
        const fromDate = mfromDate.toDate();
        const toDate = mtoDate.toDate();
        const fromDateMS = fromDate.getTime();
        const toDateMS = toDate.getTime();
        const users = this.state.groups.union(grps => {
            grps.users.forEach(gu => gu.groupName = grps.name);
            return grps.users;
        });
        const uniqueUsers = users.distinctObj(u => { return { name: u.name.toLowerCase(), display: u.displayName }; });
        const userList = uniqueUsers.map(u => u.name);
        const chartLabels = uniqueUsers.map(u => u.display);

        const { projects } = this.state;
        let { ticketsList } = this.state;

        ticketsList = (ticketsList || '').trim().replace(/[\s;]/g, ',');
        this.chartWidth = userList.length * 250;
        const custTicketsList = ticketsList ? ticketsList.split(',').filter(t => !!t) : [];

        let jql = `(worklogAuthor in ("${userList.join("\",\"")}") and worklogDate >= '${
            mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${mtoDate.clone().add(1, 'days').format("YYYY-MM-DD")}') `;
        let addJql = '';
        let hasProject = projects && projects.length > 0;
        const hasTickets = custTicketsList.length > 0;
        if (hasProject) {
            addJql += `project in (${projects.map(p => p.key).join(',')}) `;
        }
        if (hasTickets) {
            if (addJql) {
                addJql += ' or ';
            }
            const tickets = custTicketsList.join(',');
            addJql += `key in (${tickets}) or parent in (${tickets})`;
        }
        if (addJql) {
            jql += ` and (${addJql})`;
        }

        return this.$jira.searchTickets(jql, ["worklog", "project", "parent", this.state.estimationField]) //, "status", "assignee"
            .then((issues) => {
                const flatData = issues.flattern({
                    'key': true,
                    'projectName': 'fields.project.name',
                    'projectKey': 'fields.project.key',
                    'parentkey': 'fields.parent.key',
                    'estimate': (obj) => {
                        let estField = obj.fields[this.state.estimationField];
                        if (this.state.estimationField === 'timeoriginalestimate') {
                            estField = estField / 60 / 60;
                        }
                        else if (this.state.storyPointHour) {
                            estField = estField * this.state.storyPointHour;
                        }
                        return estField;
                    },
                    '~~worklog': {
                        field: 'fields.worklog.worklogs',
                        spread: false,
                        props: {
                            '...author': function (obj) { return obj.author.name.toLowerCase(); },
                            //'author': 'author.name',
                            //'authorDisplay': 'author.displayName',
                            'date': function (obj) { return obj.started ? new Date(obj.started) : null; },
                            '...yyyyMMdd': function (obj) { return obj.started ? parseInt(new Date(obj.started).format('yyyyMMdd')) : null; },
                            'timespent': function (obj) { return obj.timeSpentSeconds / 60 / 60; },
                        }
                    }
                }, (data) => userList.contains(data.author) && data.worklog.date.isBetween(fromDateMS, toDateMS));
                // Story points will be available in parent ticket. So take the estimate from parent if story point is selected.
                if (this.state.estimationField !== 'timeoriginalestimate') {
                    let parentIds = flatData.distinct(t => t.parentkey);
                    parentIds = parentIds.filter(t => t && !flatData.some(ft => ft.key === t));
                    if (parentIds.length) {
                        return this.$jira.searchTickets(`key in (${parentIds.join(',')})`, ["project", this.state.estimationField])
                            .then((parents) => {
                                const flatParents = parents.flattern({
                                    'key': true,
                                    'projectName': 'fields.project.name',
                                    'projectKey': 'fields.project.key',
                                    'estimate': (obj) => {
                                        let estField = obj.fields[this.state.estimationField];
                                        if (this.state.estimationField === 'timeoriginalestimate') {
                                            estField = estField / 60 / 60;
                                        }
                                        else if (this.state.storyPointHour) {
                                            estField = estField * this.state.storyPointHour;
                                        }
                                        return estField;
                                    }
                                }).reduce((index, ticket) => { index[ticket.key] = ticket; return index; }, {});
                                flatData.forEach(t => {
                                    const { parentkey, key } = t;
                                    if (hasTickets && custTicketsList.contains(key)) {
                                        return;
                                    }
                                    if (parentkey) {
                                        let parentT = flatParents[parentkey];
                                        if (!parentT) {
                                            parentT = flatData.first(tkt => tkt.key === parentkey);
                                            flatParents[parentkey] = parentT;
                                        }
                                        t.key = parentkey;
                                        delete t.parentkey;
                                        t.estimate = parentT.estimate;
                                    }
                                });

                                return flatData;
                            });
                    }
                }
                return flatData;
            })
            .then((flatData) => {
                let selProjects = this.state.projects;
                // If both project and ticket filter is not selected, then by default take the list of projects from data
                if (!hasProject && !hasTickets) {
                    hasProject = true;
                    selProjects = flatData.distinctObj(t => {
                        return {
                            key: t.projectKey,
                            name: t.projectName
                        };
                    });
                }
                const datasets = [];

                let colorIndex = -1;

                if (hasProject) {
                    selProjects.forEach(proj => {
                        colorIndex++;

                        const projData = flatData.filter(t => t.projectKey.toUpperCase() === proj.key.toUpperCase()
                            && (!hasTickets || !custTicketsList.contains(t.key)));
                        const estimateUserData = [];
                        const actUserData = [];
                        const estimatePrj = {
                            label: `${proj.name} (estimate)`,
                            //backgroundColor: "#3e95cd",
                            data: estimateUserData,
                            ...this.chartColours[colorIndex]
                        };

                        colorIndex++;
                        const actPrj = {
                            label: `${proj.name} (spent)`,
                            //backgroundColor: "#3e95cd",
                            data: actUserData,
                            ...this.chartColours[colorIndex]
                        };
                        userList.forEach(u => {
                            const usrData = projData.filter(t => t.author === u);
                            const tktGrp = usrData.groupBy(t => t.key);
                            const estimate = tktGrp.sum(g => g.values[0].estimate);
                            const actual = tktGrp.sum(g => g.values.sum(t => t.worklog.timespent));
                            estimateUserData.push(estimate);
                            actUserData.push(actual);
                        });
                        datasets.push(estimatePrj);
                        datasets.push(actPrj);
                    });
                }
                // If tickets are specified then add the tickets as seperate item
                if (hasTickets) {
                    flatData = flatData.filter(t => custTicketsList.contains(t.parentkey) || custTicketsList.contains(t.key));

                    flatData.forEach(t => {
                        if (custTicketsList.contains(t.key)) {
                            return;
                        }
                        t.key = t.parentkey;
                    });

                    flatData.groupBy(t => t.key).forEach(ticket => {
                        const projData = ticket.values;
                        const estimateUserData = [];
                        const actUserData = [];
                        const estimatePrj = {
                            label: `${ticket.key} (estimate)`,
                            //backgroundColor: "#3e95cd",
                            data: estimateUserData
                        };
                        const actPrj = {
                            label: `${ticket.key} (spent)`,
                            //backgroundColor: "#3e95cd",
                            data: actUserData
                        };
                        userList.forEach(u => {
                            const usrData = projData.filter(t => t.author === u);
                            const tktGrp = usrData.groupBy(t => t.key);
                            let estimate = tktGrp.sum(g => g.values[0].estimate);
                            let actual = tktGrp.sum(g => g.values.sum(t => t.worklog.timespent));
                            if (!estimate) {
                                estimate = null;
                            }
                            if (!actual) {
                                actual = null;
                            }
                            estimateUserData.push(estimate);
                            actUserData.push(actual);
                        });
                        datasets.push(estimatePrj);
                        datasets.push(actPrj);
                    });
                }

                this.setState({ isLoading: false, chartData: { labels: chartLabels, datasets, colors: this.chartColours }, selectedTab: 1 });
            });
    }

    resizeChart(value) {
        value = value * 100;
        const instances = window['Chart'].instances;
        const key = Object.keys(instances)[0];
        const Chart = instances[key];
        const canvas = Chart.canvas;
        let curWidth = parseInt(canvas.style.width.replace('px', ''));
        if (!(curWidth > 0)) {
            curWidth = 500;
        }
        else if (curWidth > this.chartWidth) {
            curWidth = this.chartWidth;
        }
        curWidth = curWidth + value;
        canvas.parentNode.style.width = `${curWidth}px`;
    }

    showGroupsPopup = () => this.setState({ showGroupsPopup: true });
    groupsChanged = (groups) => this.setState({ showGroupsPopup: false, groups })
    onDateChange = (e) => this.setState({ dateRange: e.date })
    validateData() {
        const { dateRange, groups } = this.state;
        return !(dateRange || "").fromDate || !(groups || "").length;
    }
    tabChanged = (e) => this.setState({ selectedTab: e.index })

    render() {
        const {
            storyPointField, chartOptions,
            state: { projectsList, projects, ticketsList, groups, estimationField, storyPointHour, dateRange, chartData, showGroupsPopup, selectedTab }
        } = this;

        return super.renderBase(<>
            <TabView activeIndex={selectedTab} onTabChange={this.tabChanged}>
                <TabPanel header="Settings">
                    <div className="pad-15">
                        <strong>How to use:</strong> To generate the estimate vs actual report follow the below steps
                        <ul>
                            <li>User list: Select the list of users for whom report need to be generated.</li>
                            <li>Date range: Select the date range for which worklog details need to be fetched from jira</li>
                            <li>Projects: Select one or more projects to be displayed for each users. To auto populate this field, go to Settings -&gt; General -&gt; Default values tab and provide the value for projects field.</li>
                            <li>Tickets list: Add one or more tickets seperated by comma. These tickets will be listed seperately for comparison.</li>
                            <li>Estimate type: Estimation comparison can be done based on Time estimate or Story Point estimate. If story point is selected, then optionally hours per story point can be configured to convert story point to estimated hours.</li>
                            <li><b>Note:</b> If Story Point option under Estimate type is disabled, then go to SETTINGS -&gt; General -&gt; Default values (tab) and select appropriate field for Story Points</li>
                        </ul>
                    </div>
                    <div>
                        <div className="row">
                            <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>* User list</strong>
                            </div>
                            <div className="col-sm-12 col-md-4 col-lg-4 col-xl-3">
                                <div className="form-group">
                                    <span className="link" onClick={this.showGroupsPopup}>Add / remove users</span>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>* Date range</strong>
                            </div>
                            <div className="col-sm-12 col-md-4 col-lg-4 col-xl-3">
                                <div className="form-group">
                                    <DatePicker range={true} value={dateRange} onChange={(val) => this.setState({ dateRange: val })} width={200} />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>Projects</strong>
                            </div>
                            <div className="col-sm-12 col-md-5 col-lg-4 col-xl-3">
                                <div className="form-group">
                                    <AutoComplete value={projects} onChange={val => this.setState({ projects: val })} disabled={!projectsList} dropdown={true}
                                        multiple={true} forceselection={true} displayField="name" placeholder="add one or more projects"
                                        dataset={this.searchProject} size={35} autohighlight={true} maxLength={25} className="autocomplete-350" />
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>Tickets List</strong>
                            </div>
                            <div className="col-sm-12 col-md-5 col-lg-4 col-xl-3">
                                <div className="form-group">
                                    <TextBox multiline={true} value={ticketsList} onChange={(val) => this.setState({ ticketsList: val })}
                                        placeholder="List of tickets to be viewed seperated by comma" />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>* Estimate type</strong>
                            </div>
                            <div className="col-sm-12 col-md-5 col-lg-4 col-xl-3">
                                <div className="form-group estimate-type">
                                    <RadioButton name="estimateType" onChange={(val) => this.setState({ estimationField: val })}
                                        defaultValue="timeoriginalestimate" value={estimationField} label="Time estimate" />

                                    <RadioButton name="estimateType" defaultValue={storyPointField} value={estimationField} label="Story Point"
                                        title={storyPointField ? '' : 'Select an appropriate field for story point in Settings -> General -> Default values tab -> Story point field to enable this option.'}
                                        onChange={(val) => this.setState({ estimationField: val })} disabled={!storyPointField} />
                                </div>
                            </div>
                            {estimationField === storyPointField && <div className="col-sm-12 col-md-2 col-lg-2">
                                <strong>Hours per Story point</strong>
                            </div>}
                            {estimationField === storyPointField && <div className="col-sm-12 col-md-5 col-lg-4 col-xl-3">
                                <div className="form-group">
                                    <TextBox value={storyPointHour} onChange={(val) => this.setState({ storyPointHour: val })} maxLength={5}
                                        keyfilter="num" placeholder="Specify hours per story point in average" />
                                </div>
                            </div>}
                        </div>
                        <div className="row">
                            <div className="col-sm-12 col-md-3 col-lg-3 col-xl-2">
                                <Button className="col-button-primary" disabled={this.validateData()}
                                    icon="fa fa-play-circle" label="Generate report" onClick={this.generateReport} />
                            </div>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="Chart" disabled={!chartData.datasets}>
                    <div className="chart-container">
                        <div className="magnifier">
                            <i className="fa fa-search-minus" onClick={() => this.resizeChart(-1)} title="Decrease the width of the chart" />
                            <i className="fa fa-search-plus" onClick={() => this.resizeChart(1)} title="Increase the width of the chart" />
                        </div>
                        <div className="canvas-block">
                            <div className="canvas-container">
                                <Chart className="chart" type="bar" data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>

            {showGroupsPopup && <GroupEditor groups={groups} onHide={this.groupsChanged} />}
        </>
        );
    }
}

export default EstimateActualReport;