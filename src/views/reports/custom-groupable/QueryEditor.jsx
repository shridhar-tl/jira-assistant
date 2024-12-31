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
            {id && <div className="float-start">
                <Button icon="fa fa-trash" className="margin-r-8"
                    label="Delete Query"
                    type="danger"
                    onClick={deleteQuery} />
                <Button icon="fa fa-save"
                    label="Save Query As"
                    type="success"
                    disabled={!isSaveEnabled}
                    onClick={showSaveDialog} />
            </div>}

            <div className="float-end">
                <Button
                    icon="fa fa-save"
                    className="margin-r-8"
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
                <TabView panelContainerClassName="p-0">
                    <TabPanel header="How to use">
                        <div className="pad-8">
                            <strong>Filter (JQL):</strong> JQL (Jira Query Language) is a powerful tool for filtering and extracting data from Jira.
                            To learn more about JQL, you can refer to the Atlassian documentation.
                            <br /><br />

                            <strong>Display Settings:</strong> In the Display Settings tab, you can select and retrieve specific fields needed for your report generation.
                            Only the fields you select here will be pulled from Jira. You can also use expressions for each field to control how the data is presented.
                            If certain fields are not required as columns in the report but are needed within expressions for other fields, you can hide them.
                            <br /><br />

                            <strong>Expressions:</strong>
                            <ul>
                                <li>You can use any valid JavaScript expression syntax in expressions.</li>
                                <li>To access the current field, use "this." and to access all available fields, use the "Fields" object (e.g., Fields.summary, Fields.created.name).</li>
                                <li>Only the fields selected under Display Settings tab can be used in expressions; other fields will not be available. Therefore, ensure you add all required fields before using them in expressions.</li>
                                <li>Some native functions and custom utility functions are available within expressions.</li>
                                <li>If an object is returned by the expression, it is converted to JSON and displayed within the cell.</li>
                            </ul>

                            <strong>Native libraries:</strong>
                            <ul>
                                <li>Some native functions are available for direct use in expressions.</li>
                                <li>Available Functions List: parseInt, parseFloat, isNaN, Math.*, Date, Number</li>
                            </ul>

                            <strong>Utility functions:</strong>
                            <ul>
                                <li>A set of custom utility functions is available under the "Utils" object in expressions. These functions can be called as follows: "Utils.formatDate(Fields.created)" within expressions.</li>
                                <li>
                                    <strong>Available Functions List:</strong>
                                    <ul>
                                        <li><strong>formatDate, formatTime, formatDateTime:</strong> Accepts a date object and returns a formatted date as a string.</li>
                                        <li><strong>formatSecs:</strong> Accepts the number of seconds and returns it in a readable format.</li>
                                        <li><strong>formatMS:</strong> Accepts the number of milliseconds and returns it in a readable format.</li>
                                        {/*<li><strong>showAsLink:</strong> Accepts a Jira issue key as a string and returns an anchor tag pointing to the Jira Issue.</li>*/}
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