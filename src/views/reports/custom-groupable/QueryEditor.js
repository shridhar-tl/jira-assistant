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
            deleteQuery, showSaveDialog, saveAs, viewReport
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
                    disabled={!isSaveEnabled || isSystemQuery}
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

        return jql?.trim()?.length > 10 && fields?.length >= 1;
    }

    render() {
        const { query: { fields, jql } } = this.props;

        return super.renderBase(
            <div className="query-editor">
                <TabView>
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