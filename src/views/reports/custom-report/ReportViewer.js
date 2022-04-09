import React from 'react';
import BaseGadget from "../../../gadgets/BaseGadget";
import { inject } from "../../../services/injector-service";
import { ScrollableTable, THead } from '../../../components/ScrollableTable';
import "./Common.scss";
import { EventCategory } from '../../../_constants';
import { getUserName } from '../../../common/utils';
import { TicketDisplay } from '../../../display-controls';
import AddWorklog from '../../../dialogs/AddWorklog';

class ReportViewer extends BaseGadget {
    constructor(props) {
        let { definition } = props;
        definition = definition || {};
        super(props, definition.queryName || 'Custom report viewer (deprecated)', 'fa-clock-o');
        inject(this, "AnalyticsService", "ReportService", "JiraService", "UtilsService", "UserUtilsService");
        this.state.reportDefinition = definition;
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    UNSAFE_componentWillReceiveProps(props) {
        if ((props.definition && props.definition !== this.state.reportDefinition) || props.reportId) {
            this.setState({ reportDefinition: props.definition }, this.refreshData);
        }
    }

    refreshData = () => {
        if (this.props.reportId > 0) {
            this.$report.getReportDefinition(this.props.reportId).then(qm => {
                this.setState({ reportDefinition: qm }, this.fillReport);
            });
        }
        else if (this.state.reportDefinition) {
            this.fillReport();
        }
    };

    fillReport = () => {
        const model = this.state.reportDefinition || {};

        if (model) {
            this.title = `${model.queryName} (deprecated)`;
        }

        if (!model.jql || !model.outputFields || !model.outputFields.length) {
            return;
        }

        this.setState({ isLoading: true });

        //this.showReport = true;
        this.dataFields = model.outputFields.map((f) => f.id);
        this.$jira.searchTickets(model.jql, this.dataFields)
            .then((issues) => {
                this.headerFields = model.outputFields.map((f) => {
                    let txt = f.name;
                    if (f.functions && f.functions.header) {
                        txt = f.functions.header.replace('{0}', txt);
                    }
                    return { text: txt, rowspan: 2 };
                });
                this.processIssues(issues);
                const displayFields = this.headerFields;
                const subHeads = [];
                this.headerFields.filter((f) => { return f.subCols && f.subCols.length > 0; })
                    .forEach((f) => {
                        subHeads.addRange(f.subCols);
                        subHeads.push({ text: "Total" });
                        f.colspan = f.subCols.length + 1;
                        f.rowspan = 1;
                    });

                const groupList = model.outputFields.filter((f) => { return f.groupBy; });
                const groupedData = groupList.length > 0 ? this.groupData(issues, Array.from(groupList)) : issues;
                this.dataFields = model.outputFields.filter((f) => { return !f.groupBy; });
                this.reportHtml = this.genHtmlRow(groupedData);
                const hasReportData = groupedData.length > 0;

                this.setState({ subFields: subHeads, hasReportData, displayFields, isLoading: false });
                this.$analytics.trackEvent("Custom report viewed", EventCategory.UserActions);
            });
    };

    // eslint-disable-next-line complexity
    genHtmlRow(arr, prepn) {
        const formRowJSX = (i, j, obj, issues) => {
            const html = [];
            if (prepn && i === 0 && j === 0) {
                html.addRange(prepn);
            }
            if (j === 0 && obj.issues) {
                html.push(this.getGroupedTD(obj.name, issues.length));
            }
            const issue = issues[j];
            const issFields = issue.fields;
            for (let z = 0; z < this.dataFields.length; z++) {
                const df = this.dataFields[z];
                if (df.functions && df.functions.useArray) {
                    if (j === 0) {
                        if (df.id === "issuekey") {
                            html.push(this.getAggregateTD(issues.map((iss) => iss.key), df.functions));
                        }
                        else {
                            html.push(this.getAggregateTD(issues.map((iss) => iss.fields[df.id]), df.functions));
                        }
                    }
                }
                else {
                    if (df.id === "worklog") {
                        const hdrLst = this.fieldOpts.worklogUsers;
                        const wls = issFields.worklogs_proc;
                        let totalTimeSpent = 0;
                        for (let hi = 0; hi < hdrLst.length; hi++) {
                            if (wls) {
                                const wl = wls[hdrLst[hi].id];
                                if (wl) {
                                    totalTimeSpent += wl.timespent;
                                    html.push(this.getTD(wl.timespent, df.functions));
                                    continue;
                                }
                            }
                            else {
                                html.push(this.getTD("#Error"));
                                continue;
                            }
                            html.push(this.getTD());
                        }
                        if (totalTimeSpent) {
                            html.push(this.getTD(totalTimeSpent, df.functions));
                        }
                        else {
                            html.push(this.getTD());
                        }
                    }
                    else if (df.id === 'issuekey') {
                        html.push(this.getIssueKeyTD(issue.key, df.functions));
                    }
                    else {
                        html.push(this.getTD(issFields[df.id], df.functions));
                    }
                }
            }

            return html;
        };

        const html = [];

        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            if (obj.subGroups) {
                const groupCol = this.getGroupedTD(obj.name, obj.issueCount);
                html.addRange(this.genHtmlRow(obj.subGroups, (i === 0 ? [prepn, groupCol] : [groupCol])));
            }
            else {
                const issues = obj.issues || [obj];
                for (let j = 0; j < issues.length; j++) {
                    html.push(<tr>{formRowJSX(i, j, obj, issues)}</tr>);
                }
            }
        }
        return html;
    }

    getTD(obj, funcInfo) {
        if (!obj) {
            return <td>&nbsp;</td>;
        }
        return <td>{this.execute(obj, funcInfo)}</td>;
    }

    getIssueKeyTD(obj, funcInfo) {
        if (typeof obj === 'string') {
            return <TicketDisplay value={obj} onAddWorklog={this.addWorklog} />;
            //return <td><a href={this.$userutils.getTicketUrl(obj)} target="_blank" rel="noopener noreferrer">{this.execute(obj, funcInfo)}</a></td>;
        }
        else {
            return this.getTD(obj, funcInfo);
        }
    }

    getAggregateTD(arr, funcInfo) {
        return <td className="bold" rowSpan={arr.length}>{this.execute(arr, funcInfo)}</td>;
    }

    getGroupedTD(text, len) {
        if (!text) { text = '<No Value>'; }
        text += ` (${len})`;
        const rotate = len > 4 || (text.length / len) < 2.5;
        return <td className={rotate ? 'rotateM90' : 'bold'} rowSpan={len}>&nbsp;<div>{text}</div></td>;
    }

    groupData(issues, groups) {
        if (!groups || !groups.length) {
            return issues;
        }
        const group = groups[0];
        const field = group.id;

        const func = group.functions;
        groups.removeAt(0);
        const isAggGrp = func.useArray;
        const selectFunc = (grp) => {
            const val = { name: grp.key };
            const values = grp.values;
            if (groups.length > 0) {
                val.subGroups = this.groupData(values, Array.from(groups));
                val.issueCount = val.subGroups.sum((tm) => { return tm.issueCount; });
            }
            else {
                val.issues = values;
                val.issueCount = val.issues.length;
            }
            return val;
        };
        if (isAggGrp) {
            const data = issues.map(field === "issuekey" ? (iss) => { return iss.key; } : (iss) => { return iss.fields[field]; }, true);
            return [selectFunc({ key: this.execute(data, func), values: issues })];
        }
        else {
            return issues.groupBy((issue) => {
                const fieldVal = issue.fields[field];
                if (!fieldVal) { return fieldVal; }
                return this.execute(fieldVal, func);
            }).map((grp) => selectFunc(grp));
        }
    }

    execute(obj, funcInfo) {
        if (!obj || !funcInfo || !funcInfo.name) {
            return obj;
        }
        let value = "#Error";
        try {
            let scopeObj = this.$utils;
            let func = this.$utils[funcInfo.name];

            if (!func || !func.apply) {
                func = this.$userutils[funcInfo.name];
                scopeObj = this.$userutils;
            }

            if (!func || !func.apply) {
                func = functions[funcInfo.name];
                scopeObj = obj;
            }

            if (!func || !func.apply) {
                return "#Error: Func not found";
            }

            const params = [obj].addRange(funcInfo.params);
            value = func.apply(scopeObj, params);
        }
        catch (err) {
            console.error(err);
        }
        return value !== null ? value : "";
    }

    processIssues(issues) {
        const wlIndex = this.dataFields.indexOf('worklog');
        if (wlIndex === -1) {
            return;
        }
        const subCols = [];
        const tmpUserIds = []; // Object to temporarily store the user id for faster searching
        this.fieldOpts = {};
        for (let iss = 0; iss < issues.length; iss++) {
            const issue = issues[iss];
            const fields = issue.fields;
            if (fields.worklog && fields.worklog.worklogs.length > 0) {
                const worklogs = fields.worklog.worklogs;
                const grp = worklogs.groupBy((w) => {
                    return { id: getUserName(w.author), text: w.author.displayName };
                });
                const obj = {};
                for (let g = 0; g < grp.length; g++) {
                    const gr = grp[g];
                    const keyId = gr.key.id;
                    if (tmpUserIds.indexOf(keyId) === -1) {
                        subCols.push(gr.key);
                        tmpUserIds.push(keyId);
                    } // Store it in header if it is not available in temp list
                    obj[keyId] = { timespent: gr.values.sum((v) => { return v.timeSpentSeconds; }) };
                }
                fields.worklogs_proc = obj;
            }
            else if (fields.worklog && fields.worklog.worklogs && fields.worklog.worklogs.length === 0) {
                fields.worklogs_proc = {};
            }
        }
        const headObj = this.headerFields[wlIndex];
        headObj.subCols = subCols.orderBy((c) => { return c.text; }); // Object for storing the user details to show in header
        this.fieldOpts.worklogUsers = headObj.subCols;
    }

    addWorklog = (ticketNo) => {
        const worklogItem = { ticketNo };
        this.setState({ showWorklogPopup: true, worklogItem });
    };

    hideWorklog = () => {
        this.setState({ showWorklogPopup: false });
    };

    render() {
        const {
            reportHtml,
            state: { isLoading, hasReportData, displayFields, subFields, showWorklogPopup, worklogItem }
        } = this;

        return super.renderBase(
            <div className="cust-report-viewer">
                {hasReportData && <ScrollableTable>
                    <THead>
                        <tr className="data-center">
                            {displayFields.map((g, i) => <th key={i} rowSpan={g.rowspan} colSpan={g.colspan}>{g.text}</th>)}
                        </tr>
                        {!!subFields && subFields.length > 0 && <tr className="data-center">
                            {subFields.map((g, i) => <th key={i}>{g.text}</th>)}
                        </tr>}
                    </THead>
                    {!hasReportData && !isLoading && <tbody>
                        <tr><td colSpan={displayFields && displayFields.length}>No records exists</td></tr>
                    </tbody>}
                    {hasReportData && <tbody>{reportHtml}</tbody>}
                </ScrollableTable>}
                {showWorklogPopup && <AddWorklog worklog={worklogItem} onDone={this.hideWorklog} onHide={this.hideWorklog} />}
            </div>
        );
    }
}

export default ReportViewer;

const functions = {
    last: function (arr) {
        if (!arr?.length) { return null; }
        return arr[arr.length - 1];
    },
    first: function (arr) {
        if (!arr?.length) { return null; }
        return arr[0];
    }
};