/* eslint no-fallthrough: 0 */
import React from 'react';
import { inject } from "../../../services/injector-service";
import { getDateRange } from '../../../_constants';
import BaseGadget from '../../../gadgets/BaseGadget';
import { Button, SelectBox, TextBox, Checkbox } from '../../../controls';
import { TabView, TabPanel } from 'primereact/tabview';

class QueryEditor extends BaseGadget {
    constructor(props) {
        super(props, "Query Editor", "fa-filter");
        this.isGadget = false;
        inject(this, "ReportService", "JiraService", "AnalyticsService");

        //this.groupIgnore = ['issuekey', 'summary', 'description'];
        this.state = this.getClearState(false, props);
    }

    getClearState(clear, props) {
        var { reportQuery } = this.state;

        if (!reportQuery || clear) {
            if (props && props.reportQuery) {
                reportQuery = { ...props.reportQuery };
            } else {
                reportQuery = { fields: {}, filterFields: [], outputFields: [] };
            }
        }
        else {
            reportQuery.fields = reportQuery.fields || {};
            reportQuery.filterFields = reportQuery.filterFields || [];
            reportQuery.outputFields = reportQuery.outputFields || [];
        }
        return { reportQuery, selQueryId: null };
    }

    initModel(clear) {
        this.setState(this.getClearState(!!clear));
    }

    UNSAFE_componentWillMount() {
        this.$jira.getCustomFields().then(this.processJson);
        this.fillQueriesList();
        //this.$report.getSavedQuery(value).then( (result)=> {
        //  this.reportRequest = result;
        //});
    }

    UNSAFE_componentWillReceiveProps(props) {
        this.initModel();
    }

    fillQueriesList() {
        return this.$report.getSavedFilters().then((result) => {
            //this.savedQueries = result;
            this.queryList = result.filter(q => !q.advanced).map(q => { return { value: q.id, label: q.queryName }; });
            //this.state.selQueryId = this.reportRequest.id //ToDo:|| queryList.selectpicker('val');
        });
    }

    //this.sortOpt = {
    //  update: function (e, ui) {
    //    var sortable = ui.item.sortable;
    //    var item = sortable.model;
    //    var targItem = this.state.reportQuery.outputFields[sortable.dropindex] || this.state.reportQuery.outputFields[sortable.dropindex - 1];
    //    if (targItem) {
    //      item.groupBy = targItem.groupBy;
    //    }
    //    //ui.item.sortable.cancel();
    //  }
    //};

    generateJql() {
        var query = [];
        var fields = this.state.reportQuery.filterFields;
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var val = field.value;
            var clause = (!field.custom) ? field.clauseName : field.name; // || field.name.indexOf(' ') > -1
            var val2 = field.value2;
            if (val2) {
                val2 = '"' + val2.trim() + '"';
            }
            if (clause.indexOf(' ') > -1) {
                clause = '"' + clause + '"';
            }
            if (Array.isArray(field.valueArr) && field.valueArr.length > 0) {
                val = field.valueArr.filter(v => !!v).map((v) => '"' + v.trim() + '"').join(',');
            }
            else if (field.quickDate) {
                var range = getDateRange(field.quickDate);
                val = range[0].format('yyyy-MM-dd');
                val2 = range[1].format('yyyy-MM-dd');
            }
            else if (typeof val === "string") {
                val = '"' + val.trim() + '"';
            }
            if (val) {
                query.push(field.operator.format([clause, val, val2]));
            }
        }
        return query.join(' AND ');
    }

    isSaveEnabled() {
        return this.state.reportQuery.jql && this.state.reportQuery.jql.trim().length > 10
            && this.state.reportQuery.outputFields && this.state.reportQuery.outputFields.length >= 1;
    }

    saveQuery(queryName, copy) {
        var { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        var oldQryName = reportQuery.queryName;
        if (queryName) {
            reportQuery.queryName = queryName;
            if (copy) {
                delete this.state.reportQuery.id;
            }
            this.$report.saveQuery(reportQuery).then((result) => {
                reportQuery.id = result;

                this.setState({ reportQuery, selQueryId: reportQuery.id, showSaveDialog: false });
                this.props.onSave();

                this.fillQueriesList();

                this.$message.success("Query saved successfully!");
                this.$analytics.trackEvent("Query Saved");
            }, (err) => {
                if (err && err.message) {
                    this.$message.error(err.message);
                }
            });
        }
        else {
            this.newQueryName = oldQryName;
            this.showSaveDialog = true;
        }
    }

    groupField(row, $index) {
        var grpBy = !row.groupBy;
        var list = this.state.reportQuery.outputFields;
        if (grpBy) {
            for (let i = 0; i < $index; i++) {
                list[i].groupBy = grpBy;
            }
        }
        else {
            for (let i = $index + 1; i < list.length; i++) {
                list[i].groupBy = grpBy;
            }
        }
    }

    getField(field, filter) {
        var obj = { id: field.id, name: field.name, custom: field.custom };
        if (filter) {
            obj.clauseName = field.clauseNames[0];
        }
        var schema = field.schema || {};
        var type = schema.type || "(Unsupported)";
        var system = schema.system;
        var items = schema.items;
        if (field.id === "issuekey") {
            obj.type = "string";
            return obj;
        }
        switch (type) {
            case "user":
                obj.knownObj = true;
            case "string":
            case "date":
            case "datetime":
            case "(Unsupported)":
                obj.type = type;
                break;
            case "number":
                switch (system) {
                    case "timeoriginalestimate":
                    case "aggregatetimespent":
                    case "aggregatetimeoriginalestimate":
                    case "workratio":
                    case "timespent":
                    case "timeestimate":
                    case "aggregatetimeestimate":
                        obj.type = "seconds";
                        break;
                    default:
                        obj.type = type;
                        break;
                }
                break;
            case "issuetype":
            case "priority":
            case "project":
            case "progress":
            case "comments-page":
            case "resolution":
            case "securitylevel":
            case "status":
            case "timetracking":
            case "votes":
            case "watches":
                obj.knownObj = true;
                obj.type = system;
                break;
            case "array":
                obj.isArray = true;
                if (!field.custom) {
                    switch (system) {
                        case "versions":
                        case "fixVersions":
                        case "attachment":
                        case "components":
                        case "issuelinks":
                        case "subtasks":
                            obj.knownObj = true;
                            obj.type = items || system;
                            break;
                        case "worklog":
                            obj.type = items || system;
                            obj.isArray = false;
                            break;
                        case "labels":
                            obj.type = items || system;
                            break;
                        default:
                            obj.type = JSON.stringify(field);
                            break;
                    }
                }
                else {
                    switch (items) {
                        case "user":
                            obj.knownObj = true;
                        case "string": // Fallthrough
                        case "date":
                        case "datetime":
                        case "numeric":
                        case "option":
                            obj.type = items;
                            break;
                        default:
                            obj.type = JSON.stringify(field);
                            break;
                    }
                }
                break;
            default:
                obj.type = JSON.stringify(field);
                break;
        }
        //"schema":{"type":"array","items":"version","system":"versions"}
        return obj;
    }

    filterAdded(event) {
        if (!event || !event.value) {
            return;
        }
        var field = this.jiraFields.first((f) => f.id === event.value);
        this.state.reportQuery.filterFields.push(this.getField(field, true));
        this.selectedFilterField = '';
    }

    displayFieldAdded = (val) => {
        if (!val || val.items) { // Return if a group is selected instead of items
            return;
        }

        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };
        var field = this.jiraFields.first((f) => f.id === val);
        reportQuery.outputFields = reportQuery.outputFields.concat(this.getField(field, false));
        this.setState({ reportQuery });
    }

    removeOutputField(index) {
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };
        reportQuery.outputFields.splice(index, 1);
        this.setState({ reportQuery });
    }

    processJson = (data) => {
        this.jiraFields = data;
        //var favoriteFilters = ['key', 'assignee', 'created', 'creator', 'issue type', 'labels', 'project', 'reporter', 'resolution', 'resolved', 'status', 'summary', 'updated', 'sprint'];
        var basicFields = [], customFields = [];
        data.forEach(f => {
            f.label = f.name + (f.name.toLowerCase() !== f.id.toLowerCase() ? ' (' + f.id + ')' : '');
            f.value = f.id;
            if (f.custom) {
                customFields.push(f);
            }
            else {
                basicFields.push(f);
            }
        });

        basicFields = basicFields.orderBy((f) => f.name);
        customFields = customFields.orderBy((f) => f.name);

        this.setState({
            filterFields: [
                {
                    label: 'Basic Fields',
                    items: basicFields.filter((f) => f.clauseNames && f.clauseNames.length > 0)
                },
                {
                    label: 'Custom Fields',
                    items: customFields.filter((f) => f.clauseNames && f.clauseNames.length > 0)
                }
            ]
        });
        this.setState({
            displayFields: [
                { label: 'Basic Fields', items: basicFields },
                { label: 'Custom Fields', items: customFields }
            ]
        }); // false
    }

    columnReordered(event) {
        var item = event.value;
        var drpIdx = event.dropIndex;
        var targItem = this.state.reportQuery.outputFields[drpIdx + 1] || this.state.reportQuery.outputFields[drpIdx - 1];
        if (targItem) {
            item.groupBy = targItem.groupBy;
        }
    }

    //private getOptionTags(data, group, forFilter) {
    //  if (forFilter) { data = data.filter((f) => { return f.clauseNames && f.clauseNames.length > 0; }); }
    //  var html = data.orderBy((f) => { return f.name; })//.filter( (f) =>{ return f.searchable; })
    //    .map((f) => { return '<option value="' + f.id + '"' + (f.name.toLowerCase() !== f.id.toLowerCase() ? ' data-subtext="(' + f.id + ')"' : '') + '>' + f.name + '</option>'; }).join('');
    //  if (group)
    //    return '<optgroup label="' + group + '">' + html + '</optgroup>';
    //  else
    //    return html;
    //}

    updateJql() {
        if (this.state.reportQuery.filterFields && this.state.reportQuery.filterFields.length > 0) {
            this.state.reportQuery.jql = this.generateJql();
        }
    }

    tabChanged(event) {
        if (event.index === 1) {
            this.updateJql();
        }
    }

    queryChanged(selQueryId) {
        this.$report.getSavedQuery(selQueryId).then(reportQuery => this.setState({ selQueryId, reportQuery }));
    }

    deleteQuery() {
        this.$report.deleteSavedQuery(this.selQueryId).then(q => {
            this.$message.success('Selected query deleted successfully!');
            this.initModel(true);
            this.fillQueriesList();
        });
    }



    renderCustomActions() {
        const {
            queryList,
            state: { selQueryId }
        } = this;

        if (!queryList || queryList.length === 0) {
            return null;
        }

        return <>
            <SelectBox dataset={queryList} value={selQueryId} onChange={this.queryChanged} placeholder="Select a query to edit" />
            <Button icon="fa fa-plus" onClick={this.initModel} label="New query" />
            {/*<button pButton [icon]="isFullScreen?'fa fa-compress':'fa fa-expand'" (click)="isFullScreen=!isFullScreen;onResize(isFullScreen)"></button>*/}
        </>;

    }

    getFooter() {
        const {
            reportQuery
        } = this;

        const isSaveEnabled = this.isSaveEnabled();

        return <>
            {reportQuery.id && <div className="pull-left">
                <Button icon="fa fa-trash" label="Delete Query" type="danger" onClick={this.deleteQuery} />
                <Button icon="fa fa-floppy-o" label="Save Query As" type="success" onClick={this.saveQuery} disabled={!isSaveEnabled} />
            </div>}


            <div className="pull-right">
                <Button icon="fa fa-floppy-o" label="Save Query" type="success" onClick={() => this.saveQuery(reportQuery.queryName)} disabled={!isSaveEnabled || reportQuery.isSystemQuery} />
                <Button icon="fa fa-list" label="View Report" type="info" onClick={() => this.props.viewReport(reportQuery)} disabled={!isSaveEnabled} />
            </div>
        </>;
    }

    render() {
        const {
            props: { builderOnly },
            state: { reportQuery, displayFields, }
        } = this;

        const html = <>
            <TabView>
                <TabPanel header="Filters" leftIcon="fa fa-filter">
                </TabPanel>
                <TabPanel header="Advanced Filter (JQL)">
                    <TextBox multiline={true} value={reportQuery.jql} style={{ minWidth: '100%', minHeight: 100, height: '100%' }} />
                </TabPanel>
                <TabPanel header="Display Settings" leftIcon="fa fa-columns">
                    <table className="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th className="data-center">#</th>
                                <th>Display Column</th>
                                <th>Type</th>
                                {!builderOnly && <th className="data-center" style={{ width: 35 }}>Group By</th>}
                                {!builderOnly && <th>Format function</th>}
                                <th className="data-center" style={{ width: 30 }}>Remove</th>
                            </tr>
                        </thead>
                        <tbody ngxdroppable model={reportQuery.outputFields} onDrop={this.columnReordered}>
                            {reportQuery.outputFields.map((row, $index) => <tr style={{ cursor: 'move' }} ngxdraggable model={row}>
                                <td className="data-center">{$index + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.type} {row.isArray ? '(multiple)' : ''}</td>
                                {!builderOnly && <td className="data-center"><Checkbox checked={row.groupBy} onChange={val => { row.groupBy = val; this.groupField(row, $index); }} /></td>}
                                {!builderOnly && <td jabindfunction row={row} />}
                                <td className="data-center"><i className="fa fa-times pointer" onClick={() => this.removeOutputField($index)} /></td>
                            </tr>)}
                        </tbody>
                        <tbody>
                            <tr>
                                <td className="data-center">{reportQuery.outputFields.length + 1}</td>
                                <td>
                                    <SelectBox dataset={displayFields} value="" style={{ 'width': '100%' }}
                                        placeholder="Choose a column to add to the list" group={true} displayField="name"
                                        filterPlaceholder="Type the field name to filter" onChange={this.displayFieldAdded}>
                                        {(itm, i) => {
                                            return <span>{itm.name}</span>;
                                        }}
                                        {(grp, i) => {
                                            return <strong>{grp.label}</strong>;
                                        }}
                                    </SelectBox>
                                    {/*<select id="lstCustomFields" style="width:100%;" title="Choose a column to add to the list" data-container="body"></select>*/}
                                </td>
                                <td colSpan={5}>Note: Select the column from the list to add it as output</td>
                            </tr>
                        </tbody>
                    </table>
                </TabPanel>
            </TabView >
        </>;

        if (builderOnly) { return html; }
        else { super.renderBase(html); }
    }
}

export default QueryEditor;