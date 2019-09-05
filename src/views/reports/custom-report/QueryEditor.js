/* eslint no-fallthrough: 0 */
import React from 'react';
import { inject } from "../../../services/injector-service";
import { getDateRange } from '../../../_constants';
import BaseGadget from '../../../gadgets/BaseGadget';
import { Button, SelectBox, TextBox, Checkbox } from '../../../controls';
import { TabView, TabPanel } from 'primereact/tabview';
import { ScrollableTable, THead } from "../../../components/ScrollableTable";
import BindFunction from './BindFunction';
import SaveReportDialog from '../../../dialogs/SaveReportDialog';
import Dialog from '../../../dialogs';

class QueryEditor extends BaseGadget {
    constructor(props) {
        super(props, "Query Editor", "fa-filter");
        this.className = "query-editor-gadget";
        this.isGadget = false;
        this.hideMenu = true;
        inject(this, "ReportService", "JiraService", "MessageService", "AnalyticsService");

        //this.groupIgnore = ['issuekey', 'summary', 'description'];
        this.state = this.getClearState(false, props);
        this.state.displayFields = [];
    }

    getClearState(clear, props) {
        let { reportQuery } = this.state;

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

        if (props.reportId > 0) {
            this.querySelected(props.reportId);
        }

        return { reportQuery, selReportId: null };
    }

    initModel(clear, props) {
        this.setState(this.getClearState(!!clear, props));
    }

    UNSAFE_componentWillMount() {
        this.$jira.getCustomFields().then(this.processJson);
        if (!this.props.builderOnly) {
            this.fillQueriesList();
        }
        //this.$report.getReportDefinition(value).then( (result)=> {
        //  this.reportRequest = result;
        //});
    }

    fillQueriesList() {
        this.$report.getReportsList().then((result) => {
            const reportsList = result.filter(q => !q.advanced).map(q => { return { value: q.id, label: q.queryName }; });
            this.setState({ reportsList });
            //this.state.selReportId = this.reportRequest.id //ToDo:|| reportsList.selectpicker('val');
        });
    }

    //this.sortOpt = {
    //  update: function (e, ui) {
    //    const sortable = ui.item.sortable;
    //    const item = sortable.model;
    //    const targItem = this.state.reportQuery.outputFields[sortable.dropindex] || this.state.reportQuery.outputFields[sortable.dropindex - 1];
    //    if (targItem) {
    //      item.groupBy = targItem.groupBy;
    //    }
    //    //ui.item.sortable.cancel();
    //  }
    //};

    generateJql() {
        const query = [];
        const fields = this.state.reportQuery.filterFields;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            let val = field.value;
            let clause = (!field.custom) ? field.clauseName : field.name; // || field.name.indexOf(' ') > -1
            let val2 = field.value2;
            if (val2) {
                val2 = `"${val2.trim()}"`;
            }
            if (clause.indexOf(' ') > -1) {
                clause = `"${clause}"`;
            }
            if (Array.isArray(field.valueArr) && field.valueArr.length > 0) {
                val = field.valueArr.filter(v => !!v).map((v) => `"${v.trim()}"`).join(',');
            }
            else if (field.quickDate) {
                const range = getDateRange(field.quickDate);
                val = range[0].format('yyyy-MM-dd');
                val2 = range[1].format('yyyy-MM-dd');
            }
            else if (typeof val === "string") {
                val = `"${val.trim()}"`;
            }
            if (val) {
                query.push(field.operator.format([clause, val, val2]));
            }
        }
        return query.join(' AND ');
    }

    isSaveEnabled() {
        const { reportQuery } = this.state;

        return reportQuery.jql && reportQuery.jql.trim().length > 10
            && reportQuery.outputFields && reportQuery.outputFields.length >= 1;
    }

    saveQuery = (queryName, copy) => {
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        const oldQryName = reportQuery.queryName;
        let refillList = false;

        reportQuery.queryName = queryName;
        if (copy) {
            delete reportQuery.id;
            refillList = true;
        }
        else if (oldQryName !== queryName) {
            refillList = true;
        }

        this.$report.saveQuery(reportQuery).then((result) => {
            reportQuery.id = result;

            this.setState({ showSaveDialog: false, selReportId: reportQuery.id, reportQuery });

            if (refillList) {
                this.fillQueriesList();
            }

            //this.props.onSave(reportQuery);

            this.$message.success("Report saved successfully!");
            this.$analytics.trackEvent("Custom Report Saved");
        }, (err) => {
            if (err && err.message) {
                this.$message.error(err.message);
            }
        });
    }

    groupField(row, $index) {
        const grpBy = !row.groupBy;
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };
        const list = [...reportQuery.outputFields];
        reportQuery.outputFields = list;

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
        this.queryChanged(reportQuery);
    }

    // eslint-disable-next-line complexity
    getField(field, filter) {
        const obj = { id: field.id, name: field.name, custom: field.custom };
        if (filter) {
            obj.clauseName = field.clauseNames[0];
        }
        const schema = field.schema || {};
        const type = schema.type || "(Unsupported)";
        const system = schema.system;
        const items = schema.items;
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

    filterAdded(val) {
        if (!val || val.items) { // Return if a group is selected instead of items
            return;
        }

        const field = this.jiraFields.first((f) => f.id === val);
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        reportQuery.filterFields = reportQuery.filterFields.concat(this.getField(field, true));
        this.queryChanged(reportQuery);

        this.selectedFilterField = '';
    }

    displayFieldAdded = (val) => {
        if (!val || val.items) { // Return if a group is selected instead of items
            return;
        }

        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        const field = this.jiraFields.first((f) => f.id === val);
        reportQuery.outputFields = reportQuery.outputFields.concat(this.getField(field, false));

        this.queryChanged(reportQuery);
    }

    removeOutputField(index) {
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        reportQuery.outputFields.splice(index, 1);

        this.queryChanged(reportQuery);
    }

    processJson = (data) => {
        this.jiraFields = data;
        //const favoriteFilters = ['key', 'assignee', 'created', 'creator', 'issue type', 'labels', 'project', 'reporter', 'resolution', 'resolved', 'status', 'summary', 'updated', 'sprint'];
        let basicFields = [], customFields = [];
        data.forEach(f => {
            f.label = f.name + (f.name.toLowerCase() !== f.id.toLowerCase() ? ` (${f.id})` : '');
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
        const item = event.value;
        const drpIdx = event.dropIndex;
        const targItem = this.state.reportQuery.outputFields[drpIdx + 1] || this.state.reportQuery.outputFields[drpIdx - 1];
        if (targItem) {
            item.groupBy = targItem.groupBy;
        }
    }

    //private getOptionTags(data, group, forFilter) {
    //  if (forFilter) { data = data.filter((f) => { return f.clauseNames && f.clauseNames.length > 0; }); }
    //  const html = data.orderBy((f) => { return f.name; })//.filter( (f) =>{ return f.searchable; })
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

    querySelected = (selReportId) => {
        this.$report.getReportDefinition(selReportId).then(reportQuery => this.setState({ selReportId, reportQuery }));
    }

    deleteQuery = () => {
        Dialog.confirmDelete(`Are you sure to delete the report named "${this.state.reportQuery.queryName}" permenantly?`)
            .then(() => {
                this.$report.deleteSavedQuery(this.state.selReportId).then(q => {
                    this.$message.success('Report deleted successfully!');
                    this.setState({ selReportId: null });
                    this.initModel();
                    this.fillQueriesList();
                });
            });
    }

    queryChanged = (reportQuery) => {
        this.setState({ reportQuery });
        this.props.onChange(reportQuery);
    }

    jqlChanged = (jql) => {
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };

        reportQuery.jql = jql;

        this.queryChanged(reportQuery);
    }

    setFunction = (i, func) => {
        let { reportQuery } = this.state;
        reportQuery = { ...reportQuery };
        const outputFields = [...reportQuery.outputFields];
        reportQuery.outputFields = outputFields;
        const row = { ...outputFields[i] };
        outputFields[i] = row;
        row.functions = func;
        this.queryChanged(reportQuery);
    }

    viewReport = () => this.props.onViewReport(this.state.reportQuery)
    showSaveDialog = () => this.setState({ showSaveDialog: true })
    saveAs = () => this.saveQuery(this.state.reportQuery.queryName)
    hideSaveDialog = () => this.setState({ showSaveDialog: false })

    renderCustomActions() {
        const {

            state: { reportsList, selReportId }
        } = this;

        if (!reportsList || reportsList.length === 0) {
            return null;
        }

        return <>
            <SelectBox dataset={reportsList} value={selReportId} valueField="value" onChange={this.querySelected} placeholder="Select a report to edit" />
            <Button icon="fa fa-plus" onClick={this.initModel} label="New query" />
            {/*<button pButton [icon]="isFullScreen?'fa fa-compress':'fa fa-expand'" (click)="isFullScreen=!isFullScreen;onResize(isFullScreen)"></button>*/}
        </>;

    }

    renderFooter() {
        const {
            reportQuery
        } = this.state;

        const isSaveEnabled = this.isSaveEnabled();
        const isEditing = reportQuery.id > 0;

        return <div className="pnl-footer">
            {reportQuery.id && <div className="pull-left">
                <Button icon="fa fa-trash" label="Delete Query" type="danger" onClick={this.deleteQuery} />
                <Button icon="fa fa-floppy-o" label="Save Query As" type="success" onClick={this.showSaveDialog} disabled={!isSaveEnabled} />
            </div>}

            <div className="pull-right">
                <Button icon="fa fa-floppy-o" label="Save Query" type="success" onClick={isEditing ? this.saveAs : this.showSaveDialog}
                    disabled={!isSaveEnabled || reportQuery.isSystemQuery} />
                <Button icon="fa fa-list" label="View Report" type="info" onClick={this.viewReport}
                    disabled={!isSaveEnabled} />
            </div>
        </div>;
    }

    render() {
        const {
            props: { builderOnly },
            state: { reportQuery, displayFields, showSaveDialog }
        } = this;

        const isEditing = reportQuery.id > 0;

        const html = <>
            <TabView>
                {/*<TabPanel header="Filters" leftIcon="fa fa-filter">
                </TabPanel>*/}
                <TabPanel header="Advanced Filter (JQL)">
                    <TextBox multiline={true} value={reportQuery.jql} onChange={this.jqlChanged} style={{ minWidth: '100%', minHeight: 100, height: '100%' }} />
                </TabPanel>
                <TabPanel header="Display Settings" leftIcon="fa fa-columns">
                    <ScrollableTable className="query-editor">
                        <THead>
                            <tr>
                                <th>#</th>
                                <th>Display Column</th>
                                <th className="col-type">Type</th>
                                {!builderOnly && <th className="col-group-by">Group By</th>}
                                {!builderOnly && <th className="col-format-func">Format function</th>}
                                <th>Remove</th>
                            </tr>
                        </THead>
                        <tbody model={reportQuery.outputFields} onDrop={this.columnReordered}>
                            {reportQuery.outputFields.map((row, $index) => <tr key={row._uniqueId} style={{ cursor: 'move' }} ngxdraggable model={row}>
                                <td className="data-center">{$index + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.type} {row.isArray ? '(multiple)' : ''}</td>
                                {!builderOnly && <td className="data-center"><Checkbox checked={row.groupBy} onChange={val => { row.groupBy = val; this.groupField(row, $index); }} /></td>}
                                {!builderOnly && <td><BindFunction row={row} onChange={(func) => this.setFunction($index, func)} /></td>}
                                <td className="data-center"><i className="fa fa-times pointer" onClick={() => this.removeOutputField($index)} /></td>
                            </tr>)}
                        </tbody>
                        <tbody>
                            <tr>
                                <td className="data-center">{reportQuery.outputFields.length + 1}</td>
                                <td>
                                    <SelectBox dataset={displayFields} value="" style={{ 'width': '100%' }}
                                        placeholder="Choose a column to add to the list" group={true} displayField="name" valueField="id" dataKey="id"
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
                    </ScrollableTable>
                </TabPanel>
            </TabView>
            {showSaveDialog && <SaveReportDialog queryName={reportQuery.queryName} allowCopy={isEditing}
                onHide={this.hideSaveDialog} onChange={this.saveQuery} />}
        </>;

        if (builderOnly) { return html; }
        else { return super.renderBase(html); }
    }
}

export default QueryEditor;