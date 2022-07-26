import React from 'react';
import EditableGrid from '../../../components/editable-table/EditableGrid';
import { Checkbox, Image } from '../../../controls';
import IssueKeyEditor from '../../../editor-controls/IssueKeyEditor';
import ProjectEditor from '../../../editor-controls/ProjectEditor';
import AllowedValuesEditor from '../../../editor-controls/AllowedValuesEditor';
import StringEditor from '../../../editor-controls/StringEditor';
import { inject } from '../../../services/injector-service';
import BaseImport from '../BaseImport';
import { processData } from './data-processor';
import { transformHeader } from './field-mapping';
import Footer from './Footer';
import { getDefaultColumns, noRowMessage } from './helpers';
import './ImportIssue.scss';
import DateEditor from '../../../editor-controls/DateEditor';
import classNames from 'classnames';
/**
 Scenarios to handle

 Record with key:
 - With correct project
 - With different project
 - With correct parent
 - With different parent (need to check for issue type)

 Record without key:
 - With project
 - With parent
 - Without project and parent
 - with different project and parent
 
 - Repeat issues with multiple parent or project
 - Use JQL to pull records
 - Allow removing columns or not
 - Allow editing columns or not (not required)
 - context menu support for row and col header - insert row / col, delete row / col
 - Support for deleting issues
 - Option to use bulk / individual import / delete
 */
const ignoredFieldsForImport = ['selected', 'issuekey', 'delete', 'clone', 'importStatus'];
const editorControls = {
    key: IssueKeyEditor,
    project: ProjectEditor,
    date: DateEditor,
    datetime: DateEditor
};

class ImportIssue extends BaseImport {
    constructor(props) {
        super(props, "Issue", "fa fa-ticket");
        this.className = 'import-issue';
        inject(this, "JiraService", "TicketService", "MessageService", "UserUtilsService");
        this.defaultColSettings = {
            cellTemplate: this.renderIssueCells,
            cellEditorTemplate: this.renderCellEditor,
        };
        this.defaultColumns = getDefaultColumns({
            selected: {
                headerTemplate: this.renderSelectorHeader,
                cellTemplate: this.renderSelectorBody
            },
            importStatus: {
                cellTemplate: this.renderImportStatus
            },
            clone: { cellTemplate: this.renderCloneBody },
            delete: { cellTemplate: this.renderDeleteBody }
        }, this.defaultColSettings);
        this.state = { columns: this.defaultColumns, importData: [] };
        this.$jira.getCustomFields().then(f => {
            this.customFields = f;
            this.colMapping = f.reduce((map, f) => {
                map[f.id] = f;
                return map;
            }, {});
            this.transformHeader = transformHeader(f);
        });
    }

    async processData(data) {
        this.setState({ isLoading: true });
        const processedData = processData(data, this.colMapping, this.defaultColumns, this.invalidHeaderTemplate, this.unsupportedFieldTemplate, this.defaultColSettings);
        const newState = await this.$ticket.validateIssuesForImport(processedData, this.defaultColSettings);
        newState.selectedCount = this.getSelectedCount(newState.importData);
        newState.selectAll = newState.selectedCount > 0;
        newState.isLoading = false;
        this.setState(newState);
    }

    //#region Handle selection
    getSelectedCount = (importData) => importData.filter(t => t.selected).length;

    toggleAllRows = () => {
        let { importData, selectAll } = this.state;
        selectAll = !selectAll;

        importData = importData.map(t => {
            t = { ...t };
            t.selected = !t.disabled && selectAll;
            return t;
        });

        this.setState({ importData, selectAll, selectedCount: this.getSelectedCount(importData) });
    };

    toggleSelection = (row, i) => {
        if (row.disabled) { return; }
        const importData = this.toggleCheckBox(row, i, 'selected');
        const selectedCount = this.getSelectedCount(importData);
        this.setState({ selectAll: selectedCount > 0, selectedCount });
    };

    toggleCheckBox = (row, i, fieldName) => {
        row = { ...row, [fieldName]: !row[fieldName] };

        let { importData } = this.state;
        importData = [...importData];
        importData[i] = row;

        this.setState({ importData });
        return importData;
    };
    //#endregion

    //#region Rendering functionalities

    renderSelectorHeader = () => <Checkbox checked={this.state.selectAll} onChange={this.toggleAllRows} />;
    renderSelectorBody = (f, issue, ci, ri) => <Checkbox checked={issue.selected} disabled={!issue.selected && issue.importStatus?.hasError} onChange={() => this.toggleSelection(issue, ri)} />;
    renderDeleteBody = (f, issue, ci, ri) => issue.issuekey.value && !issue.issuekey.error && <Checkbox checked={issue.delete} disabled={issue.clone} onChange={() => this.toggleCheckBox(issue, ri, 'delete')} />;
    renderCloneBody = (f, issue, ci, ri) => issue.issuekey.value && !issue.issuekey.error && <Checkbox checked={issue.clone} disabled={issue.delete} onChange={() => this.toggleCheckBox(issue, ri, 'clone')} />;

    renderImportStatus = (_, issue) => {
        const status = issue.importStatus || { hasError: true };
        if (status.hasError) {
            return <span><span className="fa fa-exclamation-triangle msg-error" title={status.error || "Has error in one or more fields"} /> Error</span>;
        }
        else if (status.hasWarning && status.warning) {
            return <span><span className="fa fa-exclamation-triangle msg-warning" title={status.warning} /> Warning</span>;
        }
        else {
            if (status.imported) {
                return (<span>Imported</span>);
            }
            else if (!issue.selected) {
                return (<span>Not Selected</span>);
            }
            else if (issue.delete) {
                return (<span>Will Delete</span>);
            }
            else if (issue.clone) {
                return (<span>Will Clone</span>);
            }
            else {
                return (<span>Will Import</span>);
            }
        }
    };

    getRowHeaderClassName(row, ri) {
        return row.importStatus.hasError ? 'error-row' : 'valid-row';
    }

    renderIssueCells = ({ field }, issue, _, __, modProps) => {
        let val = issue[field];
        if (!val || typeof val === 'string') { return val || ''; }
        const clearValue = val.clearValue;
        let modified = true;

        if (!clearValue && val.jiraValue && (issue.delete || !val.value)) {
            modified = false;
            if (Array.isArray(val.jiraValue) || typeof val.jiraValue === 'string') {
                val = { value: val.jiraValue, error: val.error };
            } else {
                val = { ...val.jiraValue, error: val.error };
            }
        } else if (modified && ((!val.value && !clearValue) || (field === 'issuekey' && !issue.clone))) {
            modified = false;
        }

        if (modified) {
            modProps.className = classNames(modProps.className, 'data-modified');
        }

        return this.renderCellContent(field, val, clearValue);
    };

    renderCellContent(field, val, clearValue) {
        const getVal = (val, i) => (<span className={i >= 0 && "link badge badge-pill skin-bg-font margin-r-5"}>
            {!!val.avatarUrl && <Image className="margin-r-5" src={val.avatarUrl} alt={val.displayText} style={{ width: '16px', height: '16px' }} />}
            {val.displayText || val.value || ''}
            {!!clearValue && <span className="data-null">null</span>}
            {!!val.error && <span className="fa fa-exclamation-triangle msg-error margin-l-5" title={val.error} />}
            {!!val.warning && <span className="fa fa-exclamation-triangle msg-warning margin-l-5" title={val.warning} />}
        </span>);

        if ((field === 'issuekey' || field === 'parent') && !val.error) {
            return (<a href={this.$userutils.getTicketUrl(val.value)} target="_blank" rel="noreferrer">{val.displayText || val.value}</a>);
        } else if (Array.isArray(val.value)) {
            return val.value.map(getVal);
        } else {
            return getVal(val);
        }
    }

    invalidHeaderTemplate = (col) => <span>{col.field} <span className="fa fa-exclamation-triangle msg-error" title="Unknown field. This will not be imported." /></span>;
    unsupportedFieldTemplate = (col) => <span>{col.field} <span className="fa fa-exclamation-triangle msg-error" title="Unsupported field. This will not be imported." /></span>;
    setFocus = (ref) => ref?.focus();
    renderCellEditor = (data, column, rowIndex, cell, setValue, endEdit) => {
        const { fieldType } = column;
        const valueObj = data[column.field];
        let Editor = editorControls[fieldType];
        let dataset;
        const showTime = fieldType === 'datetime';
        if (!Editor && valueObj?.allowedValues) {
            Editor = AllowedValuesEditor;
            dataset = valueObj.allowedValues;
        } else if (!Editor) {
            Editor = StringEditor;
        }

        let value = valueObj?.value;
        if (!value && !valueObj?.clearValue) {
            value = valueObj?.jiraValue;
            if (typeof value === 'object') {
                value = value.value;
            }
        }

        return <Editor
            value={value}
            onChange={(value, modified) => this.valueChanged(value, modified, endEdit, column, rowIndex)}
            dataset={dataset} multiple={!!valueObj?.isArray} showTime={showTime}
        />;
    };

    valueChanged = async (valObj, modified, endEdit, column, rowIndex) => {
        if (modified) {
            let { importData } = this.state;
            const row = { ...importData[rowIndex] };
            importData = [...importData];
            const cell = { ...row[column.field] };
            delete cell.value;
            delete cell.displayText;
            delete cell.avatarUrl;
            row[column.field] = { ...cell, ...valObj };

            const { columns, addedFields } = this.state;
            importData[rowIndex] = await this.$ticket.validateIssueForImport(row, columns, addedFields, false, this.defaultColSettings);
            this.setState({ importData });
        }
        endEdit();
    };

    //#endregion

    //#region Common functions
    //#endregion

    //#region Footer functionalities
    clearImportData = () => {
        this.setState({ columns: null, importData: null, selectedCount: null });
    };

    renderFooter() {
        const { isLoading, selectedCount } = this.state;

        return (<Footer isLoading={isLoading} selectedCount={selectedCount}
            clearImportData={this.clearImportData} importIssues={this.importIssues} />);
    }

    importIssues = async () => {
        const { columns, addedFields } = this.state;
        let { importData } = this.state;
        importData = [...importData];

        this.setState({ isLoading: true, uploading: true });
        const cols = columns.filter(c => !ignoredFieldsForImport.includes(c.field));
        const selectedRowsIndex = importData.findAllIndex(t => t.selected);
        //const selectedRows = selectedRowsIndex.map(i => importData[i]);

        try {
            await selectedRowsIndex.mapAsync(async index => {
                const issue = { ...importData[index] };
                importData[index] = issue;

                await this.$ticket.importIssue(issue, cols, addedFields);
            });
        } finally {
            this.setState({ isLoading: false, uploading: false, importData });
        }

        /*
        this.$ticket.importIssue(selectedRows).then(result => {
            importData = [...importData];

            selectedRowsIndex.forEach((arrayIndex, loopIndex) => {
                importData[arrayIndex] = result[loopIndex];
            });

            this.setState({ isLoading: false, uploading: false, importData });
        }, (error) => {
            this.$message.error(error, "Import failed");
            this.setState({ isLoading: false, uploading: false });
        });*/
    };
    //#endregion

    render() {
        const { columns, importData } = this.state;

        return super.renderBase(
            <EditableGrid
                columns={columns} rows={importData}
                noRowMessage={noRowMessage}
                getRowHeaderClassName={this.getRowHeaderClassName}
                height="calc(100vh - 140px)"
            />
        );
    }
}

export default ImportIssue;

