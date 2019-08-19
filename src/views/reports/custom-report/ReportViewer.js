import React from 'react';
import BaseGadget from "../../../gadgets/BaseGadget";
import { inject } from "../../../services/injector-service";

class ReportViewer extends BaseGadget {
    constructor(props) {
        super(props, 'Query report viewer', 'fa-clock-o');
        inject(this, "AnalyticsService", "ReportService", "TicketService", "$transformService");
        this.queryModel = {};
    }
    ngOnChanges(change) {
        if ((change.queryModel && change.queryModel.currentValue)
            || (change.queryId && change.queryId.currentValue)) {
            this.generateReport(this.queryModel);
        }
        else {
            this.queryModel = {};
        }
    }
    generateReport(queryModel) {
        this.queryModel = queryModel;
        if (queryModel) {
            this.title = queryModel.queryName;
        }
        this.refreshReport();
    }
    refreshReport() {
        if (this.queryId > 0) {
            this.$report.getSavedQuery(this.queryId).then(qm => {
                this.queryModel = qm;
                this.fillReport();
            });
        }
        else if (this.queryModel) {
            this.fillReport();
        }
    }
    fillReport() {
        var model = this.queryModel;
        if (!model.jql || !model.outputFields || !model.outputFields.length) {
            return;
        }
        this.isLoading = true;
        //this.showReport = true;
        this.dataFields = model.outputFields.map((f) => f.id);
        this.$ticket.searchTickets(model.jql, this.dataFields)
            .then((issues) => {
                this.headerFields = model.outputFields.map((f) => {
                    var txt = f.name;
                    if (f.functions && f.functions.header) {
                        txt = f.functions.header.replace('{0}', txt);
                    }
                    return { text: txt, rowspan: 2 };
                });
                this.processIssues(issues);
                this.displayFields = this.headerFields;
                var subHeads = [];
                this.headerFields.filter((f) => { return f.subCols && f.subCols.length > 0; })
                    .ForEach((f) => {
                        subHeads.addRange(f.subCols);
                        subHeads.push({ text: "Total" });
                        f.colspan = f.subCols.length + 1;
                        f.rowspan = 1;
                    });
                this.subFields = subHeads;
                this.groupList = model.outputFields.filter((f) => { return f.groupBy; });
                var groupedData = this.groupList.length > 0 ? this.groupData(issues, Array.from(this.groupList)) : issues;
                this.dataFields = model.outputFields.filter((f) => { return !f.groupBy; });
                this.reportHtml = this.genHtmlRow(groupedData);
                //var tbody = $("#tbody").html(this.genHtmlRow(groupedData));
                this.hasReportData = groupedData.length > 0;
                //setTimeout( () =>{ tbody.closest("table").bootstrapTable({ height: 400 }) }, 1000);
                this.onResize({});
            }).then(() => {
                this.isLoading = false;
                this.$analytics.trackEvent("Generated report");
            });
    }
    genHtmlRow(arr, prepn) {
        prepn = prepn || "";
        var html = "";
        for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            if (obj.subGroups) {
                html += this.genHtmlRow(obj.subGroups, (i === 0 ? prepn : "") + this.getGroupedTD(obj.name, obj.issueCount));
            }
            else {
                var issues = obj.issues || [obj];
                for (var j = 0; j < issues.length; j++) {
                    html += "<tr>";
                    if (i === 0 && j === 0) {
                        html += prepn;
                    }
                    if (j === 0 && obj.issues) {
                        html += this.getGroupedTD(obj.name, issues.length);
                    }
                    var issue = issues[j];
                    var issFields = issue.fields;
                    for (var z = 0; z < this.dataFields.length; z++) {
                        var df = this.dataFields[z];
                        if (df.functions && df.functions.useArray) {
                            if (j === 0) {
                                if (df.id === "issuekey") {
                                    html += this.getAggregateTD(issues.map((iss) => iss.key), df.functions);
                                }
                                else {
                                    html += this.getAggregateTD(issues.map((iss) => iss.fields[df.id]), df.functions);
                                }
                            }
                        }
                        else {
                            if (df.id === "worklog") {
                                var hdrLst = this.fieldOpts.worklogUsers;
                                var wls = issFields.worklogs_proc;
                                var totalTimeSpent = 0;
                                for (var hi = 0; hi < hdrLst.length; hi++) {
                                    if (wls) {
                                        var wl = wls[hdrLst[hi].id];
                                        if (wl) {
                                            totalTimeSpent += wl.timespent;
                                            html += this.getTD(wl.timespent, df.functions);
                                            continue;
                                        }
                                    }
                                    else {
                                        html += this.getTD("#Error");
                                        continue;
                                    }
                                    html += this.getTD();
                                }
                                if (totalTimeSpent) {
                                    html += this.getTD(totalTimeSpent, df.functions);
                                }
                                else {
                                    html += this.getTD();
                                }
                            }
                            else {
                                html += this.getTD(df.id !== "issuekey" ? issFields[df.id] : issue.key, df.functions);
                            }
                        }
                    }
                    html += "</tr>";
                }
            }
        }
        return html;
    }
    getTD(obj, funcInfo) {
        if (obj == null) {
            return '<td>&nbsp;</td>';
        }
        return '<td>' + this.execute(obj, funcInfo) + '</td>';
    }
    getAggregateTD(arr, funcInfo) {
        return '<td class="bold" rowspan="' + arr.length + '">' + this.execute(arr, funcInfo) + '</td>';
    }
    getGroupedTD(text, len) {
        text += " (" + len + ")";
        var rotate = len > 4 || (text.length / len) < 2.5;
        return '<td class="' + (rotate ? 'rotateM90' : 'bold') + '" rowspan="' + len + '">&nbsp;<div>' + text + '</div></td>';
    }
    groupData(issues, groups) {
        if (!groups || !groups.length) {
            return issues;
        }
        var group = groups[0];
        var field = group.id;
        var isCustom = group.custom;
        var func = group.functions;
        groups.RemoveAt(0);
        var isAggGrp = func.useArray;
        var selectFunc = (grp) => {
            var val = { name: grp.key };
            var values = grp.values;
            if (groups.length > 0) {
                val.subGroups = this.groupData(values, Array.from(groups));
                val.issueCount = val.subGroups.Sum((tm) => { return tm.issueCount; });
            }
            else {
                val.issues = values;
                val.issueCount = val.issues.length;
            }
            return val;
        };
        if (isAggGrp) {
            var data = issues.map(field === "issuekey" ? (iss) => { return iss.key; } : (iss) => { return iss.fields[field]; }, true);
            return [selectFunc({ key: this.execute(data, func), values: issues })];
        }
        else {
            return issues.groupBy((issue) => {
                var fieldVal = issue.fields[field];
                if (!fieldVal)
                    return fieldVal;
                return this.execute(fieldVal, func);
            }).map((grp) => selectFunc(grp));
        }
    }
    execute(obj, funcInfo) {
        if (!obj || !funcInfo || !funcInfo.name) {
            return obj;
        }
        var value = "#Error";
        try {
            var func = this.$transform[funcInfo.name];
            if (!func || !func.apply) {
                return "#Error: Func not found";
            }
            var params = [obj].addRange(funcInfo.params);
            value = func.apply(this.$transform, params);
        }
        catch (err) {
            console.error(err);
        }
        return value !== null ? value : "";
    }
    processIssues(issues) {
        var wlIndex = this.dataFields.indexOf('worklog');
        if (wlIndex === -1) {
            return;
        }
        var subCols = [];
        var tmpUserIds = []; // Object to temporarily store the user id for faster searching
        this.fieldOpts = {};
        for (var iss = 0; iss < issues.length; iss++) {
            var issue = issues[iss];
            var fields = issue.fields;
            if (fields.worklog && fields.worklog.worklogs.length > 0) {
                var worklogs = fields.worklog.worklogs;
                var grp = worklogs.groupBy((w) => {
                    return { id: w.author.name, text: w.author.displayName };
                });
                var obj = {};
                for (var g = 0; g < grp.length; g++) {
                    var gr = grp[g];
                    var keyId = gr.key.id;
                    if (tmpUserIds.indexOf(keyId) === -1) {
                        subCols.push(gr.key);
                        tmpUserIds.push(keyId);
                    } // Store it in header if it is not available in temp list
                    obj[keyId] = { timespent: gr.values.Sum((v) => { return v.timeSpentSeconds; }) };
                }
                fields.worklogs_proc = obj;
            }
            else if (fields.worklog && fields.worklog.worklogs && fields.worklog.worklogs.length === 0) {
                fields.worklogs_proc = {};
            }
        }
        var headObj = this.headerFields[wlIndex];
        headObj.subCols = subCols.orderBy((c) => { return c.text; }); // Object for storing the user details to show in header
        this.fieldOpts.worklogUsers = headObj.subCols;
    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default ReportViewer;