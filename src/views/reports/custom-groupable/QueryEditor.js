import React from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import JQLEditor from '../../../jira-controls/JQLEditor';
import DisplayFields from './DisplayFields';
import BaseGadget from '../../../gadgets/BaseGadget';
import { Button, SelectBox } from '../../../controls';

class QueryEditor extends BaseGadget {
    constructor(props) {
        super(props, "Query Editor", "fa-filter");
        this.className = "query-editor-gadget";
        this.isGadget = false;
        this.hideMenu = true;
        this.hideRefresh = true;
    }

    displayFieldChanged = (fields) => this.props.onChange({ ...this.props.query, fields });
    jqlChanged = (jql) => this.props.onChange({ ...this.props.query, jql });

    renderFooter() {
        const {
            query: { id, isSystemQuery },
            deleteQuery, showSaveDialog, saveAs, viewReport,
            allowSave
        } = this.props;

        const isSaveEnabled = this.isSaveEnabled();
        const isEditing = id > 0;

        return <div className="pnl-footer">
            {id && <div className="pull-left">
                <Button icon="fa fa-trash"
                    label="Delete Query"
                    type="danger"
                    onClick={deleteQuery} />
                <Button icon="fa fa-floppy-o"
                    label="Save Query As"
                    type="success"
                    disabled={!isSaveEnabled}
                    onClick={showSaveDialog} />
            </div>}

            <div className="pull-right">
                <Button
                    icon="fa fa-floppy-o"
                    label="Save Query"
                    type="success"
                    disabled={!isSaveEnabled || isSystemQuery || !allowSave}
                    onClick={isEditing ? saveAs : showSaveDialog} />
                <Button
                    icon="fa fa-list"
                    label="View Report"
                    type="info"
                    disabled={!isSaveEnabled}
                    onClick={viewReport} />
            </div>
        </div>;
    }

    renderCustomActions() {
        const { reportsList, reportId } = this.props;

        if (!reportsList || reportsList.length === 0) {
            return null;
        }

        return <>
            <SelectBox dataset={reportsList} value={reportId} valueField="value"
                onChange={this.props.querySelected} placeholder="Select a report to edit" />
            <Button icon="fa fa-plus" onClick={this.props.initModel} label="New query" />
        </>;
    }

    isSaveEnabled() {
        const { query: { jql, fields } } = this.props;

        return jql?.trim()?.length > 10 && fields?.filter(f => !f.hide)?.length >= 1;
    }

    render() {
        const { query: { fields, jql } } = this.props;

        return super.renderBase(
            <div className="query-editor">
                <TabView panelContainerClassName="no-pad">
                    <TabPanel header="How to use">
                        <div className="pad-8">
                            <strong>Filter (JQL):</strong> JQL is used to filter and pull data from Jira. You can read more about JQL from atlassian site.<br /><br />

                            <strong>Display Settings:</strong> Display settings tab lets you to select and pull all the fields required by you for report generation. Only the fields selected in this tab would be pulled from Jira.
                            You can use Expressions for each field to control how the data is rendered. You can hide the fields if it is not required as a column in the report and can be used within expressions of other fields.<br /><br />

                            <strong>Expressions:</strong>
                            <ul>
                                <li>Any valid JavaScript expression syntax can be used in expressions.</li>
                                <li>To access current field, "this" can be used and to access all the available fields, "Fields" object can be used. (Eg: Fields.summary, Fields.created.name)</li>
                                <li>Only the fields selected under Display Settings tab can be used in expressions and other fields would be unavailable. Hence add all the required fields before using it in expression.</li>
                                <li>Some of the native functions and custom utility functions are available within expressions.</li>
                                <li>If an object is returned by the expression, then it is converted as JSON and displayed within the cell.</li>
                            </ul>

                            <strong>Native libraries:</strong>
                            <ul>
                                <li>Some of the native functions are available for use directly in expressions.</li>
                                <li>Available Functions List: parseInt, parseFloat, isNaN, Math.*, Date, Number</li>
                            </ul>

                            <strong>Utility functions:</strong>
                            <ul>
                                <li>Set of custom utility functions are available under "Utils" object in expressions. These functions can be called like "Utils.formatDate(Fields.created)" in expressions.</li>
                                <li>
                                    <strong>Available Functions list:</strong>
                                    <ul>
                                        <li><strong>formatDate, formatTime, formatDateTime:</strong> Accepts date object and returns formatted date as string</li>
                                        <li><strong>formatSecs:</strong> Accepts number of secs and returns it in readable format</li>
                                        <li><strong>formatMS:</strong> Accepts number of milliseconds and returns it in readable format</li>
                                        {/*<li><strong>showAsLink:</strong> Accepts Jira issue key as string and returns anchor tag pointing to Jira Issue</li>*/}
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </TabPanel>
                    <TabPanel header="Filter (JQL)">
                        <JQLEditor jql={jql} onChange={this.jqlChanged} />
                    </TabPanel>
                    <TabPanel header="Display Settings">
                        <DisplayFields fields={fields} onChange={this.displayFieldChanged} />
                    </TabPanel>
                </TabView>
            </div>
        );
    }
}

export default QueryEditor;