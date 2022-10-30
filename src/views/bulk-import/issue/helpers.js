import { exportCsv } from "../../../common/utils";

export const noRowMessage = (<span>Upload the list of issues by clicking the ( <span className="fa fa-upload" /> ) icon in top right corner.
    Click <span className="link" onClick={downloadTemplate}>here</span> to download a sample template.</span>);

export const ImportActions = {
    Error: -1,
    None: 0,
    New: 1,
    Move: 2,
    Convert: 3, // Move parent
    Update: 4,
    Clone: 5,
    Delete: 10
};

export const colSpecialProps = {
    summary: { width: 400 },
    project: { width: 200 },
    assignee: { width: 200 },
    reporter: { width: 200 },
    clone: { width: 30, style: { minWidth: 30, textAlign: 'center' } },
    delete: { width: 30, style: { minWidth: 30, textAlign: 'center' } },
};

export function getDefaultColumns(addlProps, settings) {
    return [
        { field: 'selected', displayText: '#', width: 30, style: { minWidth: '30px', paddingLeft: '4px' }, editable: false, ...addlProps.selected },
        { field: 'issuekey', fieldType: 'key', displayText: 'Key', ...settings, headerEditable: false },
        { field: 'clone', displayText: <span className="fa fa-copy" title="Clone selected tickets" />, editable: false, ...colSpecialProps.clone, ...addlProps.clone },
        { field: 'delete', displayText: <span className="fa fa-trash" title="Permanently delete selected tickets" />, editable: false, ...colSpecialProps.delete, ...addlProps.delete },
        { field: 'project', fieldType: 'project', displayText: 'Project', ...settings, headerEditable: false, ...colSpecialProps.project },
        { field: 'issuetype', fieldType: 'issuetype', displayText: 'Issue Type', ...settings, headerEditable: false, ...colSpecialProps.issuetype },
        { field: 'parent', fieldType: 'key', displayText: 'Parent', ...settings, headerEditable: false, ...colSpecialProps.parent },
        { field: 'summary', fieldType: 'string', displayText: 'Summary', ...settings, headerEditable: false, ...colSpecialProps.summary },
        { field: 'status', fieldType: 'status', displayText: 'Status', ...settings, headerEditable: false },
        { field: 'importStatus', displayText: 'Import Status', editable: false, ...addlProps.importStatus }
    ];
}

// Private functions
function downloadTemplate() {
    const lines = [
        "Ticket No,Project,Parent ticket,IssueType,Summary,Assignee,Reporter,Priority,Status,Resolution",
        ",JAS,,Story,Sample template to be downloaded for Issues import,admin",
        ",JAS,,Bug,Summary of Bug to be imported,admin",
        ",JAS,,Task,Third task to be imported,admin"
    ];
    exportCsv(lines.join("\n"), "sample_issues");
}